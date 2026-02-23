// Web Audio API 音声合成 - scrum-guard スタイル
// 外部ファイル不要、すべてオシレーターで生成

class SoundManager {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  play(type: "stamp" | "correct" | "wrong" | "alarm" | "enter" | "gameOver") {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case "stamp": {
        // 短い機械的なスタンプ音
        osc.frequency.value = 150;
        osc.type = "square";
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
        break;
      }
      case "correct": {
        // 上昇するメジャーコード（C5-E5-G5）
        osc.frequency.value = 523;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.stop(ctx.currentTime + 0.4);
        break;
      }
      case "wrong": {
        // 下降するブザー音
        osc.frequency.value = 200;
        osc.type = "sawtooth";
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
        break;
      }
      case "alarm": {
        // バイオハザード警報 - 連行時
        osc.frequency.value = 800;
        osc.type = "square";
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start(ctx.currentTime);
        // 交互に周波数を切り替え（ウーウー音）
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.45);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.stop(ctx.currentTime + 0.6);
        break;
      }
      case "enter": {
        // キャラ登場音
        osc.frequency.value = 330;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.stop(ctx.currentTime + 0.2);
        break;
      }
      case "gameOver": {
        // ゲームオーバー - 不吉な下降音
        osc.frequency.value = 440;
        osc.type = "sawtooth";
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
        osc.stop(ctx.currentTime + 1.0);
        // 追加の低音
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 80;
        osc2.type = "square";
        gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.3);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        osc2.start(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 1.2);
        break;
      }
    }
  }
}

export const sound = new SoundManager();
