import Marketing_T650_T701_Render from '@/components/Marketing_T650_T701_Render';

export default function MarketingRenderPage() {
    return (
        <main className="min-h-screen bg-black flex items-center justify-center p-20">
            <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                <Marketing_T650_T701_Render />
            </div>
        </main>
    );
}
