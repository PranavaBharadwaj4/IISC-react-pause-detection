import asyncio
import websockets
from pydub import AudioSegment
import io
async def process_audio(websocket, path):
    async for audio_data in websocket:
        # Process the audio data here (e.g., save it to a file, perform analysis, etc.)
        # print(f"Received audio data: {audio_data}")
        
        
        file_path = "/Users/pranava/Desktop/Stash/IISC/react-pause-detection/audio.wav"
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_data), format='webm')

        # Export the AudioSegment to a wave file
        audio_segment.export(file_path, format='wav')

        print("Audio file saved successfully.")

start_server = websockets.serve(process_audio, "localhost", 8000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
