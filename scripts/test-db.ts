import { fetchCollectionAction } from "../src/app/actions";

async function test() {
  try {
    const data = await fetchCollectionAction("projects");
    console.log("PROJECTS:", data.length);
  } catch (e: any) {
    console.error("ERROR MESSAGE:", e.message);
    console.error("ERROR CAUSE:", e.cause);
    if (e.cause && e.cause.message) {
      console.error("CAUSE MESSAGE:", e.cause.message);
    }
  }
}

test();
