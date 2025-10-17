import GuardBottomNav from "../../components/GuardBottomNav";

export default function Timeline() {
  return (
    <div className="p-5 space-y-5 pb-16">
      <h1 className="text-2xl font-bold text-primary">Patrol Timeline</h1>
      <p className="text-gray-600">This section will show all your actions for the day.</p>
      {/* Later, fetch data from activity_log or guard_sessions */}
      <GuardBottomNav />
    </div>
  );
}
