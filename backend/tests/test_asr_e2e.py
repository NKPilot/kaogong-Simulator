"""
端到端测试：TTS 生成答案 → 转 WAV → ASR 识别 → 对比原文

用法：
    cd backend && uv run python tests/test_asr_e2e.py

需要配置 .env 中的 MINIMAX_API_KEY 和 DASHSCOPE_API_KEY
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from tempfile import NamedTemporaryFile

import requests

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

FFMPEG = "/tmp/ffmpeg"

# 模拟考生答案
SAMPLE_ANSWER = (
    "我认为这幅漫画反映了当前社会中存在的形式主义问题。"
    "一些基层干部在工作中过于注重表面功夫，忽视了实际效果。"
    "这种现象不仅浪费了公共资源，也损害了政府公信力。"
    "要解决这个问题，需要从完善考核机制和加强监督两方面入手。"
)

API_BASE = "http://127.0.0.1:8000"


def tts_synthesize(text: str) -> bytes:
    """调用 MiniMax TTS 生成 MP3"""
    resp = requests.post(
        f"{API_BASE}/api/tts/minimax",
        json={"text": text, "voice": "Chinese (Mandarin)_Male_Announcer"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.content


def mp3_to_wav(mp3_data: bytes) -> bytes:
    """用 ffmpeg 将 MP3 转为 16kHz mono WAV"""
    with NamedTemporaryFile(suffix=".mp3", delete=False) as f_mp3:
        f_mp3.write(mp3_data)
        mp3_path = f_mp3.name

    wav_path = mp3_path + ".wav"
    try:
        subprocess.run(
            [FFMPEG, "-y", "-i", mp3_path, "-ar", "16000", "-ac", "1",
             "-sample_fmt", "s16", wav_path],
            check=True, capture_output=True,
        )
        with open(wav_path, "rb") as f:
            return f.read()
    finally:
        os.unlink(mp3_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)


def asr_recognize(wav_data: bytes) -> str:
    """调用 ASR 接口识别 WAV"""
    resp = requests.post(
        f"{API_BASE}/api/asr/recognize",
        files={"audio": ("test.wav", wav_data, "audio/wav")},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("text", "")


def main():
    print("=" * 60)
    print("端到端测试：MiniMax TTS → ASR 识别 → 对比原文")
    print("=" * 60)

    # 1. TTS
    print("\n[1/4] 调用 MiniMax TTS 生成答案音频...")
    mp3_data = tts_synthesize(SAMPLE_ANSWER)
    print(f"  MP3 大小: {len(mp3_data)} bytes")

    # 2. 转 WAV
    print("\n[2/4] ffmpeg 转 16kHz mono WAV...")
    wav_data = mp3_to_wav(mp3_data)
    print(f"  WAV 大小: {len(wav_data)} bytes")

    # 3. ASR
    print("\n[3/4] 调用 DashScope ASR 识别...")
    result = asr_recognize(wav_data)
    print(f"  识别结果: {result}")

    # 4. 对比
    print("\n[4/4] 对比原文与识别结果:")
    print(f"  原文: {SAMPLE_ANSWER}")
    print(f"  识别: {result}")

    # 简单比对
    original_no_punct = SAMPLE_ANSWER.replace("。", "").replace("，", "").replace("、", "")
    result_no_punct = result.replace("。", "").replace("，", "").replace("、", "")

    # 计算字符级相似度（简化版）
    matches = sum(1 for c in result_no_punct if c in original_no_punct)
    total = len(original_no_punct)
    if total > 0:
        similarity = matches / total * 100
        print(f"\n  字符覆盖率: {similarity:.1f}% ({matches}/{total})")

    print("\n" + "=" * 60)
    print("测试完成")


if __name__ == "__main__":
    main()
