"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { seedData } from "@/actions/seed-action";

export default function SeedPage() {
    const [status, setStatus] = useState("Idle");

    const handleSeed = async () => {
        setStatus("Seeding...");
        try {
            await seedData();
            setStatus("Success! Data seeded.");
        } catch (e) {
            console.error(e);
            setStatus("Error seeding data.");
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Development Tools</h1>
            <p className="mb-4">Use this to populate the database with test data (Partners, Invoices).</p>
            <div className="flex gap-4 items-center">
                <Button onClick={handleSeed} disabled={status === "Seeding..."}>
                    Run Seed Script
                </Button>
                <span>Status: {status}</span>
            </div>
        </div>
    );
}
