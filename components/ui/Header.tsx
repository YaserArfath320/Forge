import { Button } from '@base-ui/react';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { ArrowRight, Zap } from 'lucide-react';
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import PricingModal from '../PricingModal';
import { checkUser } from '@/lib/checkUSers';
import { PLANS } from '@/lib/constants';
import { Plan } from '@/types/plans';

const Header = async () => {
    const user = await checkUser();
    return (
        <header className='w-full fixed top-0 left-0 z-50 h-16 border-b border-white/6 bg-white/7 backdrop-blur-md' >
            <nav className='mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 ' >
                <Link href='/'>
                    <Image
                        src={"/logo.png"}
                        alt="Forge Logo"
                        width={100}
                        height={100}
                        className="h-9 w-auto rounded-md"
                    />
                </Link>

                <div className='flex items-center gap-5' >
                    <Show when="signed-in">
                        <Link
                            href={"/projects"}
                            className='text-[13px] font-medium text-white/40 transition-colors
                     hover:text-white/80'
                        >
                            Projects
                        </Link>

                        {user && (
                            <PricingModal>
                                <span
                                    className="inline-flex h-8 items-center gap-1.5 rounded-full border
      border-white/10 bg-white/5 px-3 text-xs text-white/70"
                                >
                                    <Zap className="h-3 w-3 fill-white/70" />
                                    {user.credits} / {PLANS[user.plan as Plan].credits} credits
                                </span>
                            </PricingModal>
                        )}
                        <UserButton />
                    </Show>

                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <button className="text-white/40 hover:text-white/80 transition-colors font-medium text-sm">
                                Sign in
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal" >
                            <button className="h-9 px-4 rounded-full bg-white text-black font-semibold 
                                               flex items-center gap-2 hover:bg-white/90
                                               transition-all active:scale-95"
                            >
                                Get Started
                                <ArrowRight className='h-4 w-4' />
                            </button>
                        </SignUpButton>
                    </Show>
                </div>
            </nav>
        </header>
    );
}

export default Header