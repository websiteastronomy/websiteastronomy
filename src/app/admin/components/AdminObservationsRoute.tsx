"use client";

import { useAuth } from "@/context/AuthContext";
import AdminRouteSection from "./AdminRouteSection";
import CoreObservationsManager from "./CoreObservationsManager";
import ObservationsManager from "./ObservationsManager";

export default function AdminObservationsRoute() {
  const { isAdmin } = useAuth();

  return <AdminRouteSection>{isAdmin ? <ObservationsManager /> : <CoreObservationsManager />}</AdminRouteSection>;
}
