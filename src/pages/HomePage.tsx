import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui";

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-3">
          Welcome to <span className="text-brand-400">Neurofy</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          A smart healthcare platform for detecting, tracking, and managing hand
          tremors using wearable technology and real-time clinical insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader
            title="For Patients"
            subtitle="Monitor your condition in real time"
          />
          <p className="text-sm text-gray-400 mb-4">
            Track tremor episodes, view severity trends, receive alerts, and
            share your data with your doctor — all from one dashboard.
          </p>
          <Link to="/signup" className="btn-primary inline-block text-sm">
            Get Started
          </Link>
        </Card>

        <Card>
          <CardHeader
            title="For Doctors"
            subtitle="Review and manage patient tremor data"
          />
          <p className="text-sm text-gray-400 mb-4">
            Access patient histories, add clinical notes, generate reports, and
            monitor severe cases with a dedicated doctor dashboard.
          </p>
          <Link to="/signup" className="btn-primary inline-block text-sm">
            Join as Doctor
          </Link>
        </Card>
      </div>

      <Card className="text-center">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold text-brand-400">24/7</p>
            <p className="text-sm text-gray-500 mt-1">Continuous Monitoring</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-400">Real-time</p>
            <p className="text-sm text-gray-500 mt-1">Live Dashboards</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-400">Secure</p>
            <p className="text-sm text-gray-500 mt-1">Medical Records</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
