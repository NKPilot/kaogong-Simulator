"""Generate TTS audio for a long answer text, save as recording, and prepare for scoring.

Splits text into <=500 char chunks (DashScope TTS limit), synthesizes each,
concatenates MP3 audio, and saves to recordings/{session_id}/q0.webm.
"""

import json
import os
import sys
import time
import uuid
from pathlib import Path

import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer
from dashscope.audio.tts_v2.speech_synthesizer import AudioFormat

# Add backend to path so we can import app services
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load .env before importing dashscope-dependent modules
def load_dotenv(env_path: str) -> None:
    if not os.path.isfile(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key not in os.environ:
                os.environ[key] = val


load_dotenv(Path(__file__).resolve().parent.parent / ".env")
dashscope.api_key = os.environ.get("DASHSCOPE_API_KEY", "")

RECORDINGS_DIR = Path(__file__).resolve().parent.parent / "recordings"

# The user's prepared answer for question js_exam_00b2138b2b_q01
ANSWER_TEXT = """漫画中，第一组人物显然骑错了车：老人该用轮椅却配了大自行车，成年人蜷缩在小车上，孩子吃力地蹬着大车——每个人都别扭、局促，甚至危险。第二组则截然不同：老人用手动轮椅代步车，有人骑自行车，有人骑三轮车，每个人都与自己的"工具"恰到好处地匹配。这生动揭示了一个朴素却常被忽视的道理：社会资源配置只有"适其位"，才能"尽其用""舒其心"。

联想到现实，最典型的"错位"之一便是老龄化社会中的适老化设施不足。我国60岁以上人口已近3亿，但许多城市的人行道、公交站、社区服务点依然按照年轻人的"标准尺寸"设计：台阶过高、绿灯时间过短、公共轮椅借还点稀少、老年助行车难以上公交……就像漫画里坐在轮椅上的老人却被塞进一辆大自行车，看似给了"出行工具"，实则根本跑不起来。许多老人被迫使用不符合自身需求的代步车，甚至铤而走险开电动三、四轮车上路，安全隐患巨大。这背后，是公共服务在"精准匹配"上的粗放——我们提供了资源，却没有提供"合适的资源"。

另一个典型场景是家庭育儿中的"角色错位"。漫画中孩子骑大车、大人骑小车，就像现实中父母替孩子背负过重的学业压力，把孩子当"大车"来要求，而自己却牺牲了职业发展和生活品质，骑在"小车"里蜷缩着。这种错位往往导致亲子双方身心俱疲。

为什么会出现这种"人车不匹配"的现象？我认为有三点深层原因：一是标准化思维的惯性——公共政策容易追求"一套方案覆盖所有人"，忽略了老人、儿童、残障人士等群体的差异化需求。二是资源分配中的"代际错位"——年轻人主导的社会设计，很难真正体察老年人的日常痛点，就像健康人永远想不到轮椅过坎有多难。三是对"合适"二字的忽视——我们常把"拥有"当作目标，却忘了"匹配"才是舒适的前提。

要让每个人都"骑上合适的车"，需要从观念到制度做出改变：首先，推动"适老化改造"从理念走向清单。比如老旧小区加装电梯、路口设置缓坡、公交配备翻板，以及推广符合老年人人体工学的辅助出行工具，漫画中那种手摇轮椅代步车就值得借鉴。其次，在公共服务中引入"用户画像"思维——城市更新前，先邀请老年人、轮椅使用者参与体验式调研，让他们自己说需要什么样的"车"。最后，倡导社会形成"各安其位"的价值共识：不盲目追求"大而全"，而是尊重每个人在不同阶段、不同能力下的真实需求。老人不必逞强去骑自行车，年轻人也不必蜷缩在过小的岗位上——适合，才是最好的效率。

漫画最后，每个人都骑上了适合自己的车，道路也因此顺畅而平和。这正是一个理想社会的缩影：不是所有人用同一种方式奔跑，而是每个人都能用适合自己的节奏，安全、从容地抵达想去的地方。让"人"与"车"各得其所，我们才不至于在错位中徒耗力气，才能真正驶向一个更有温度的未来。"""

MAX_CHUNK = 200
TTS_TIMEOUT_MS = 90_000  # 90 seconds per chunk


def synthesize_chunk(text: str, voice: str = "longxiaocheng_v2") -> bytes:
    """Synthesize speech with longer timeout and retry."""
    synthesizer = SpeechSynthesizer(
        model="cosyvoice-v2",
        voice=voice,
        format=AudioFormat.MP3_22050HZ_MONO_256KBPS,
        speech_rate=1.05,
        pitch_rate=1.0,
        volume=50,
    )
    return synthesizer.call(text, timeout_millis=TTS_TIMEOUT_MS)


def split_text(text: str, max_len: int = MAX_CHUNK) -> list[str]:
    """Split text into chunks at sentence boundaries, each <= max_len."""
    # First split by paragraphs
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    chunks = []
    current = ""

    for para in paragraphs:
        # Split paragraph into sentences
        sentences = []
        buf = ""
        for ch in para:
            buf += ch
            if ch in "。！？!?" and buf.strip():
                sentences.append(buf)
                buf = ""
        if buf.strip():
            sentences.append(buf)

        for sent in sentences:
            if len(current) + len(sent) <= max_len:
                current += sent
            else:
                if current.strip():
                    chunks.append(current.strip())
                # If a single sentence is still too long, force-split it
                if len(sent) > max_len:
                    for j in range(0, len(sent), max_len):
                        chunks.append(sent[j:j + max_len])
                    current = ""
                else:
                    current = sent

    if current.strip():
        chunks.append(current.strip())
    return chunks


def main():
    session_id = uuid.uuid4().hex
    session_dir = RECORDINGS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    chunks = split_text(ANSWER_TEXT)
    print(f"Split text into {len(chunks)} chunks")
    for i, chunk in enumerate(chunks):
        print(f"  Chunk {i+1}: {len(chunk)} chars")

    all_audio = b""
    for i, chunk in enumerate(chunks):
        print(f"Synthesizing chunk {i+1}/{len(chunks)} ({len(chunk)} chars)...", flush=True)
        for attempt in range(3):
            try:
                audio = synthesize_chunk(chunk)
                all_audio += audio
                print(f"  OK: {len(audio)} bytes", flush=True)
                break
            except Exception as e:
                print(f"  Attempt {attempt+1} failed: {e}", flush=True)
                if attempt < 2:
                    wait = (attempt + 1) * 5
                    print(f"  Retrying in {wait}s...", flush=True)
                    time.sleep(wait)
                else:
                    print(f"  FAILED after 3 attempts", flush=True)
                    raise

    output_path = session_dir / "q0.webm"
    output_path.write_bytes(all_audio)
    print(f"\nSaved {len(all_audio)} bytes to {output_path}")

    # Save initial scoring.json so session shows in history
    scoring_file = session_dir / "scoring.json"
    scoring_data = [{
        "question_index": 0,
        "question_id": "js_exam_00b2138b2b_q01",
        "status": "ready",
    }]
    scoring_file.write_text(json.dumps(scoring_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved scoring metadata to {scoring_file}")

    print(f"\nSESSION_ID={session_id}")


if __name__ == "__main__":
    main()
