---
title: Site Reliability Engineering Audiobook
tags:
---
Recently I wanted to revisit some chapters from the great [SRE Book](https://sre.google/books/) while on the go. Unfortunately, I was not able to find an `audio` version of it. Below is the description how one could make it oneself.

## Read Aloud
Easiest solution to listen to this book on a mobile phone would be to open it in **Chrome** and then click **Listen to this article**. That works, but has some drawbacks:
- Book is published as multiple separate pages, need to switch them manually
- No bookmarks, listening position gets reset when you have interruption for a couple of days
- Audio stops after some time when you turn off the screen. Need to keep screen on
- Need internet connection

That could be fixed by [@Voice Aloud Reader](https://play.google.com/store/apps/details?id=com.hyperionics.avar&hl=en). Unfortunately its actual voice quality is worse than in **Chrome**.

Another options would be [Elevenreader](https://elevenreader.io/) and [Speechify](https://speechify.com/pricing/):
- Quality is much better than in **Chrome**
- Limits to 2h/week, and internet connection is required

Ok, let's see how hard it is to get a "good old" mp3 files for an audiobook player.

## Model
At the time of this writing, top TTS model [at huggingface](https://huggingface.co/models?pipeline_tag=text-to-speech&sort=likes) is [Kokoro-82M](https://github.com/hexgrad/kokoro)

![](/assets/img/2025/sre-1.png)
{ width="100%" }

It does not have "voice cloning" as in XTTS2. But it is still fully self-hosted and of a better audio quality, as shown by [TTS-Spaces-Arena](https://huggingface.co/spaces/Pendrokar/TTS-Spaces-Arena):

![](/assets/img/2025/sre-2.png)
{ width="100%" }

Also, it has a docker distribution via [remsky/Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI), so could be started as simple as:
```bash
docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu
```
Then you can open web UI at [http://localhost:8880/web/](http://localhost:8880/web/) and check the output quality on some text examples. Which sounds pretty great!
But how to get the input, i.e text from a bunch of html pages?
## HTML to Text
Let's start with Table of Contents:
https://sre.google/workbook/table-of-contents/
Need to parse this page, and get `title` and `url` for each chapter. For example, with something like this:
```python
def getLinks(url: str) -> List[tuple]:
    res = []
    base = '/'.join(url.split('/')[0:3])
    page = requests.get(url).content
    content = BeautifulSoup(page, 'html.parser').find(id="content")
    for link in content.find_all('a'):
        ref = link.get('href', '')        
        if ref.startswith('/'):
            ref = base + ref # make absolute link
        if ref == url:
            continue # link to TOC itself
        res.append((link.text.strip(), ref))
    return res
```

Now for each url, we need to get page content as a text. Let's also drop first `<h1>` tag with name of the chapter. Because we already know it from the Table of Contents. (And I prefer announcement like "Chapter 6 - Eliminating Toil", instead of just "Eliminating Toil" from the page itself)
```python
def getText(url: str) -> str:
    page = requests.get(url).content
    content = BeautifulSoup(page, 'html.parser').find(id="content")
    content.find('h1').extract() # remove first H1, as it is the same as link title
    return content.text
```
And that's it!
Now let's stitch that together, and save each chapter as a separate file named `{num}-{title}.mp3`.

Another thing which I want to add, is a chapter title announcement in the beginning with a short pause afterwards. Unfortunately, there is no tags support in Kokoro. [Quick solution](https://www.reddit.com/r/LocalLLaMA/comments/1j5xn6x/insert_pauses_into_text_file_for_kokoro/) would be to use `;-,` chars, while [proper solution](https://github.com/vijay120/kokoro-tts/commit/9455e3b8f8cc61f90d32bc5b10646ccc19ea3511#diff-9227ae7386190fba73c8d495212a3bb07dc25ed455656c69cee7e49fba6b8dacR461) is to actually generate silence.
So, here is the full version of a quick scraper:
```python
import requests
from typing import List
from bs4 import BeautifulSoup

def getLinks(url: str) -> List[tuple]:
    res = []
    base = '/'.join(url.split('/')[0:3])
    page = requests.get(url).content
    content = BeautifulSoup(page, 'html.parser').find(id="content")
    for link in content.find_all('a'):
        if (ref := link.get('href', '')) == '':
            continue
        if ref.startswith('/'):
            ref = base + ref
        if ref == url:
            continue
        res.append((link.text.strip(), ref))
    return res

def getText(url: str) -> str:
    page = requests.get(url).content
    soup = BeautifulSoup(page, 'html.parser').find(id="content")
    soup.find('h1').extract() # remove first H1, as it the same as link title
    return soup.text

def generate(input, filename: str):
    response = requests.post(
        "http://localhost:8880/v1/audio/speech",
        json={
            "model": "kokoro",
            "input": input,
            "voice": "am_michael(2)+am_santa(1)",
            "response_format": "mp3",  # Supported: mp3, wav, opus, flac
            "speed": 1.0,
            "normalization_options": {
                "normalize": False
            }
        }
    )
    with open(filename, "wb") as f:
        f.write(response.content)

if __name__ == "__main__":
    i = 0
    for link in getLinks("https://sre.google/workbook/table-of-contents/"):
        print(link[0])
        text = f"{link[0]}.\n;-,;-,;-,;-,;-,;-\n\n" # chapter announcement
        text += getText(link[1])
        generate(text, f'{i:03}-{link[0]}.mp3')
        i += 1
```

## Performance
Let's take for example this page: https://sre.google/workbook/foreword-II/
Audio version of it has duration of `12m18s`
- `2m42s` is the audio generation time on Apple M3 CPU, so generation speed is ~5x of a playback speed.
- `4m43s`(~2.6x) on AMD Ryzen 5500, just for comparison.
- `1m15s` (~10x) on Apple M3, by moving from FastAPI to locally running [kokoro](https://github.com/hexgrad/kokoro) on CPU.
  There is even [an option](https://github.com/hexgrad/kokoro?tab=readme-ov-file#macos-apple-silicon-gpu-acceleration) to enable GPU acceleration for Mac via `PYTORCH_ENABLE_MPS_FALLBACK=1` but it does not work, needs [mlx](https://github.com/hexgrad/kokoro/issues/211).
- `27s` (~27x) on Apple M3 GPU, by running FastAPI locally via `./start-gpu_mac.sh`
- `15s` (~50x) on RTX 5080, by running FastAPI GPU docker container in WSL2 (needs [sm-120 workaround](https://github.com/remsky/Kokoro-FastAPI/issues/365))
- `11s` (~67x) on RTX 5080, by running kokoro directly in WSL2

Using GPU, resulting times for the whole book:
- "SRE book" total duration is `22h02m`, audio generation time is `19m03s`
- "SRE workbook" total duration is `17h53m`, audio generation time is `16m30s`

## Alternatives
https://github.com/yl4579/StyleTTS2
https://github.com/matatonic/openedai-speech
https://github.com/p0n1/epub_to_audiobook
https://eamag.me/2025/Voice-Cloning

Even better solution would be to use [html-to-markdown](https://github.com/JohannesKaufmann/html-to-markdown) and then use some paid stuff like https://www.openai.fm, where you can fine tune tone and emotions. But let's leave it for non-techical literature)
