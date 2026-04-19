"use server";

import { db } from "@/db";
import { users, events, event_registrations, event_volunteers, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logs";
import { isFeatureEnabled, getSystemConfig } from "@/lib/system-modules";

export async function registerForEvent(eventId: string, name?: string, email?: string) {
  try {
    if (!(await isFeatureEnabled("attendance"))) {
      return { success: false, error: "Attendance module is currently disabled." };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    let authUser = session?.user;
    let dbUser = null;

    // 2. Fetch Event Details
    const eventRes = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!eventRes.length) return { success: false, error: "Event not found." };
    const event = eventRes[0];

    const requiresAuthenticatedRegistration =
      !event.isPublic || event.registrationType === "internal";

    if (requiresAuthenticatedRegistration && !authUser) {
      return {
        success: false,
        error:
          event.registrationType === "internal"
            ? "Authentication required for internal registration."
            : "Authentication required for private events.",
      };
    }

    if (authUser) {
      const userRes = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
      if (userRes.length) {
        dbUser = userRes[0];
        if (dbUser.status !== 'approved') return { success: false, error: "Wait for admin approval" };
        // Internal/private registrations require an established member role.
        if (requiresAuthenticatedRegistration && !dbUser.roleId) {
           return { success: false, error: "This is a members-only event" };
        }
      }
    } else {
        // Public guest registration logic
        if (!name || !email) {
            return { success: false, error: "Name and email are required for public registration." };
        }
    }

    const registrationResult = await db.transaction(async (tx) => {
      const allRegs = await tx
        .select()
        .from(event_registrations)
        .where(eq(event_registrations.eventId, eventId));

      if (dbUser && allRegs.some(r => r.userId === dbUser.id)) {
        void logActivity({
          userId: dbUser.id,
          action: "attendance_scan_duplicate",
          entityType: "event_registration",
          entityId: eventId,
          details: { eventId, reason: "duplicate_user_registration" },
        });
        return { success: false as const, error: "Already registered" };
      }
      if (!dbUser && email && allRegs.some(r => r.email === email)) {
        void logActivity({
          action: "attendance_scan_duplicate",
          entityType: "event_registration",
          entityId: eventId,
          details: { eventId, email, reason: "duplicate_guest_registration" },
        });
        return { success: false as const, error: "Already registered with this email" };
      }

      if (allRegs.length >= event.maxParticipants) {
        return { success: false as const, error: "Registration is full" };
      }

      await tx.insert(event_registrations).values({
        id: uuidv4(),
        eventId,
        userId: dbUser?.id || null,
        name: dbUser?.name || name || "Anonymous",
        email: dbUser?.email || email || null,
        isVolunteer: false,
        isBackupVolunteer: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { success: true as const };
    });

    if (!registrationResult.success) {
      return registrationResult;
    }

    await logActivity({
      userId: dbUser?.id || authUser?.id || null,
      action: "attendance_scan_success",
      entityType: "event_registration",
      entityId: eventId,
      details: {
        eventId,
        registrationType: dbUser ? "member" : "guest",
      },
    });

    return { success: true };

  } catch (err: any) {
    console.error("Registration engine error:", err);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function applyForVolunteer(eventId: string) {
  try {
    if (!(await isFeatureEnabled("attendance"))) {
      return { success: false, error: "Attendance module is currently disabled." };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Authentication required to volunteer." };
    const authUser = session.user;

    const userRes = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    const dbUser = userRes[0];
    if (dbUser.status !== 'approved') return { success: false, error: "Account pending approval." };

    const eventRes = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!eventRes.length) return { success: false, error: "Event not found." };
    const event = eventRes[0];

    if (!event.enableVolunteer) return { success: false, error: "Volunteering is not enabled for this event." };

    const allVols = await db.select().from(event_volunteers).where(eq(event_volunteers.eventId, eventId));
    
    if (allVols.some(v => v.userId === dbUser.id)) {
      return { success: false, error: "Already applied as a volunteer." };
    }

    let isBackup = false;
    let message = "";
    const activeVols = allVols.filter(v => !v.isBackup).length;
    const backupVols = allVols.filter(v => v.isBackup).length;

    if (activeVols < event.volunteerLimit) {
      isBackup = false;
      message = "Successfully applied as Volunteer!";
    } else if (backupVols < event.backupVolunteerLimit) {
      isBackup = true;
      message = "Volunteer slots full. Added as Backup Volunteer.";
    } else {
      return { success: false, error: "All volunteer positions and backups are currently full." };
    }

    await db.insert(event_volunteers).values({
      id: uuidv4(),
      eventId,
      userId: dbUser.id,
      isBackup,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true, message, isBackup };
  } catch (err) {
    console.error("Volunteer application error:", err);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function getEventStats(eventId: string) {
  try {
    const systemConfig = await getSystemConfig();
    if (!systemConfig.featureFlags.attendance) {
      return { totalRegistrations: 0, volunteers: 0, backupVolunteers: 0, userRegistered: false, userVolunteered: false };
    }

    const allRegs = await db.select().from(event_registrations).where(eq(event_registrations.eventId, eventId));
    const allVols = await db.select().from(event_volunteers).where(eq(event_volunteers.eventId, eventId));
    const isVol = allVols.filter(r => !r.isBackup).length;
    const isBack = allVols.filter(r => r.isBackup).length;
    
    // Also see if current user is registered
    let userRegistered = false;
    let userVolunteered = false;
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) {
      userRegistered = allRegs.some(r => r.userId === session.user.id);
      userVolunteered = allVols.some(v => v.userId === session.user.id);
    }
    
    return {
      totalRegistrations: allRegs.length,
      volunteers: isVol,
      backupVolunteers: isBack,
      userRegistered,
      userVolunteered
    };
  } catch (err) {
    console.error(err);
    return { totalRegistrations: 0, volunteers: 0, backupVolunteers: 0, userRegistered: false, userVolunteered: false };
  }
}

// Core/Admin-only fetcher for robust participant mapping
// Now uses RBAC hasPermission() instead of legacy role strings.
export async function getEventParticipants(eventId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;

    const canManage = await hasPermission(session.user.id, "manage_events");
    if (!canManage) return null;

    const regs = await db.select().from(event_registrations).where(eq(event_registrations.eventId, eventId));
    const vols = await db.select().from(event_volunteers).where(eq(event_volunteers.eventId, eventId));

    return { registrations: regs, volunteers: vols };
  } catch(e) {
    console.error(e);
    return null;
  }
}

export async function getUserProfile() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    const userId = session.user.id;

    const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRes.length) return null;
    const user = userRes[0];

    // Resolve normalized role name from RBAC table
    let roleName = "none";
    if (user.roleId) {
      const roleRes = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
      roleName = roleRes[0]?.name || "none";
    }

    // Resolve manage_events permission (Core Committee + Admin)
    const canManageEvents = await hasPermission(userId, "manage_events");

    return {
      status: user.status as string,
      roleName,
      canManageEvents,
    };
  } catch {
    return null;
  }
}
