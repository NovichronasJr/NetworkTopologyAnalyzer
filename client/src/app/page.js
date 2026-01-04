"use client"
import { useEffect } from "react";
import DashBoard from "../components/Dashboard";
import { useRouter } from "next/navigation";
export default function Home() {
 
  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-8">
      <DashBoard/>
      </div>
  );
}
