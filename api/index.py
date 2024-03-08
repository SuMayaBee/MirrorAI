from fastapi import FastAPI, Response
import fireworks.client
import base64
import requests                                                                                         
from typing import Optional
from urllib.parse import urlparse
from pydantic import BaseModel
import os
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from gtts import gTTS
from dotenv import load_dotenv


load_dotenv()



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Item(BaseModel):
    message: str

class ImageData(BaseModel):
    image_base64: str

# Variable to store the base64 image string
image_base64 = None

class Message(BaseModel):
    message: str

class Question(BaseModel):
    question: str

@app.post("/sendImage")
async def receive_image(image_data: ImageData):
    # Save the base64 string of the image
    global image_base64
    image_base64 = image_data.image_base64
    #print(image_base64)
    return {"message": "Image received"}


@app.get("/describe_image")
def describe_image():
    # Check if an image has been received
    if image_base64 is None:
        return {"error": "No image received"}

    fireworks.client.api_key = os.getenv("FIREWORKS_API_KEY")


    response = fireworks.client.ChatCompletion.create(
        model = "accounts/fireworks/models/firellava-13b",
        messages = [{
            "role": "user",
            "content": [{
                "type": "text",
                "text": "Can you describe this image with in 10-15 words?",
            }, {
                "type": "image_url",
                "image_url": {
                    "url": f"{image_base64}"
                },
            }, ],
        }],
    )
    return response.choices[0].message.content


@app.post("/describe_image")
async def describe_image(question: Question):
    # Check if an image has been received
    if image_base64 is None:
        return {"error": "No image received"}

    fireworks.client.api_key = os.getenv("FIREWORKS_API_KEY")

    response = fireworks.client.ChatCompletion.create(
        model = "accounts/fireworks/models/firellava-13b",
        messages = [{
            "role": "user",
            "content": [{
                "type": "text",
                "text": question.question,
            }, {
                "type": "image_url",
                "image_url": {
                    "url": f"{image_base64}"
                },
            }, ],
        }],
    )
    return response.choices[0].message.content


@app.post("/talk")
async def generate_speech(data: Message):
    message = data.message if data.message else 'No message provided'

    # Generate speech
    tts = gTTS(text=message, lang='en')
    tts.save("speech.mp3")

    # Read the file and return the audio
    with open("speech.mp3", "rb") as f:
        audio = f.read()

    # Remove the file after reading it
    os.remove("speech.mp3")

    return Response(audio, media_type='audio/mpeg')


@app.get("/describe_image/{question}")
def describe_image(question: str):
    # Check if an image has been received
    if image_base64 is None:
        return {"error": "No image received"}

    fireworks.client.api_key = os.getenv("FIREWORKS_API_KEY")

    response = fireworks.client.ChatCompletion.create(
        model = "accounts/fireworks/models/firellava-13b",
        messages = [{
            "role": "user",
            "content": [{
                "type": "text",
                "text": question,
            }, {
                "type": "image_url",
                "image_url": {
                    "url": f"{image_base64}"
                },
            }, ],
        }],
    )
    return response.choices[0].message.content


### uvicorn api.index:app --reload

### // python3 -m