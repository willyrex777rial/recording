import asyncio
import websockets
import numpy as np

async def test():
    async with websockets.connect("ws://localhost:8000/ws") as ws:
        # Send 2 seconds of dummy float32 audio
        dummy = np.zeros(16000 * 2, dtype=np.float32)
        await ws.send(dummy.tobytes())
        print("Sent dummy audio")
        res = await ws.recv()
        print("Received:", res)

asyncio.run(test())
