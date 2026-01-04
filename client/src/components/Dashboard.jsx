"use client"

import Image from "next/image"
import '.././styles/index.css'
import Link from "next/link"
export default function DashBoard() {

    return (
        <>
            <div className="container w-full min-h-[700px] mx-auto">
                <div className="cards">

                    <Link href={'/api/profile'} prefetch={false}><div className="card flex flex-col justify-center items-center" >
                        <Image src={"/user.png"} width={100} height={100} alt="User Profile"/>
                            <h3>User Profile</h3>
                    </div></Link>

                    <Link href={'/api/scan'} prefetch={false}><div className="card flex flex-col justify-center items-center" >
                        <Image src={"/scan.png"} width={100} height={100} alt="Network Scan"/>
                            <h3>Network Scan</h3>
                    </div></Link>

                    <Link href={'/api/history'} prefetch={false}><div className="card flex flex-col justify-center items-center" >
                        <Image src={"/history.png"} width={100} height={100} alt="Scan History"/>
                        <h3>Scan History</h3>
                    </div></Link>

                </div>
            </div>
        </>
    )
}