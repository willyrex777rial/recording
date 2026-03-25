import asyncio
import os
import numpy as np
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model once on startup
print("Loading Whisper model...")
model = WhisperModel("base.en", device="cpu", compute_type="int8")
print("Model loaded.")

# Sample rate expected from the frontend
SAMPLE_RATE = 16000

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected for live transcription.")

    # We will accumulate audio float32 frames here.
    # Whisper needs context, so we transcribe the buffer, emit the text, and
    # optionally clear or keep a small sliding window.
    audio_buffer = np.array([], dtype=np.float32)

    # Process chunks every N seconds of accumulated audio
    PROCESS_INTERVAL_SECONDS = 2.0

    try:
        while True:
            # Receive raw float32 PCM data
            data = await websocket.receive_bytes()

            if len(data) == 0:
                continue

            # Convert bytes to float32 numpy array
            chunk = np.frombuffer(data, dtype=np.float32)
            audio_buffer = np.concatenate((audio_buffer, chunk))

            # If we have enough audio, process it
            if len(audio_buffer) >= SAMPLE_RATE * PROCESS_INTERVAL_SECONDS:
                # To prevent memory bloat on hours of recording, we keep the buffer capped.
                # In a true streaming setup with Whisper, we might use VAD to chunk sentences.
                # Here, we transcribe the current window and clear it (or keep a slight overlap).

                # Keep a 0.5s overlap for context boundary
                overlap_samples = int(SAMPLE_RATE * 0.5)

                audio_to_process = audio_buffer.copy()

                # Shift buffer, keeping the overlap for the next round
                if len(audio_buffer) > overlap_samples:
                    audio_buffer = audio_buffer[-overlap_samples:]
                else:
                    audio_buffer = np.array([], dtype=np.float32)

                # Run transcription in a thread to not block the event loop
                text = await asyncio.to_thread(_transcribe, audio_to_process)

                if text:
                    print(f"Transcribed: {text}")
                    await websocket.send_json({"text": text, "status": "success"})

    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as e:
        print(f"WebSocket Error: {e}")
        try:
             await websocket.send_json({"text": "", "status": "error", "message": str(e)})
        except:
             pass

def _transcribe(audio_array: np.ndarray) -> str:
    try:
        segments, info = model.transcribe(audio_array, beam_size=5, language="en", condition_on_previous_text=False)
        text = " ".join([segment.text for segment in segments])
        return text.strip()
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
