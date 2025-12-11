import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { VisitorCounter } from '@/components/VisitorCounter';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
        <VisitorCounter />
        <div className="absolute inset-0 opacity-20 bg-[url('/pattern.svg')]"></div>

        <div className="z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 drop-shadow-sm">
            DALMUTI
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-slate-300 font-light">
            위대한 달무티가 당신을 기다립니다. 신분과 전략이 지배하는 이 고전 카드 게임에서 권력을 쟁취하거나 농노로 전락하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/lobby">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                게임 시작
              </Button>
            </Link>
            <a href="#how-to-play">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-500 text-slate-300 hover:text-white hover:border-white">
                규칙 배우기
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-800">게임 방법</h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-6 bg-slate-50 rounded-xl shadow-sm border border-slate-100">
              <div className="text-4xl mb-4">👑</div>
              <h3 className="text-xl font-bold mb-2">목표</h3>
              <p className="text-slate-600">
                가장 먼저 모든 카드를 없애세요. 손에 든 카드를 빨리 비울수록 다음 라운드에서 더 높은 계급을 얻게 됩니다.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl shadow-sm border border-slate-100">
              <div className="text-4xl mb-4">🃏</div>
              <h3 className="text-xl font-bold mb-2">카드</h3>
              <p className="text-slate-600">
                계급은 1(달무티)부터 12(농노)까지 있습니다. 숫자가 낮을수록 좋습니다. 카드의 개수는 해당 계급의 숫자와 같습니다 (예: 12는 12장).
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl shadow-sm border border-slate-100">
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="text-xl font-bold mb-2">규칙</h3>
              <p className="text-slate-600">
                같은 계급의 카드를 내세요. 앞 사람이 낸 카드와 같은 장수여야 하며, 더 낮은 숫자(더 좋은 계급)의 카드만 낼 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
