import uvicorn
from os import getenv
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


if __name__ == "__main__":
    port = int(getenv("PORT", 8000))
    uvicorn.run("api.index:app", host="0.0.0.0", port=port, reload=True)