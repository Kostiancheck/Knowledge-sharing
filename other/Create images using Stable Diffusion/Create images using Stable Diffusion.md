# Example
Let's create some image using Stable Diffusion. One of the methods is to use [Fooocus](https://github.com/lllyasviel/Fooocus) tool that uses [Juggernaut](https://civitai.com/models/133005/juggernaut-xl) model (think about it like extended version of default Stable Diffusion XL). Go to [Fooocus](https://github.com/lllyasviel/Fooocus) repo and download it on your machine, or, as I'm doing, you can easily use Google Colab.

The simplest character to do is some beautiful women with blue eyes, pink hair, and shiny smile in bikini somewhere on vacation. But we are **NERDS** and don't give a f about this bullshit, so let's create some D&D characters!

Prompt: dnd character, orc war domain cleric with long hair and mountain background
![[Pasted image 20240702181724.png]]


But it's better to make the first image as a portrait, so let's update the prompt, change picture ratio and also increase Guidance Scale
Prompt: dnd character portrait, orc war domain cleric with long hair, big scar, eyebrow piercing, tusks and mountain background
![[Pasted image 20240702190406.png]]

LGTM!
But the model ignored piercing part completely! So let's increase the weight of it by highlighting it and using Command + ↑

Prompt: dnd character portrait, orc war domain cleric with long hair, (big scar:1.3), (eyebrow piercing:1.3), tusks, and mountain background
![[Pasted image 20240702191048.png]]
Instead of eyebrow piercing it added ear one, and instead of scar added red makeup  🤷🏻‍♂️
I've tried to add "red, ear piercing" as Negative Prompt, and play around with prompts

Prompt: dnd character portrait, orc war domain cleric with long hair, (scar:1.3), (mouth tusk:1.2), and mountain background
![[Pasted image 20240702192604.png]]

but it didn't help, so let's stick to the some of the previous picture and work with it ignoring lack of scar and piercing
Final image am gonna use:
![[Pasted image 20240702190406.png]]

Now let's make more images of our character Bob (yeah, from now he has a name). A lot of artists are generating images with poses/scenes and after that doing face-swap. It can work, but it's harder to do and it leads to some problem with skin tones and face expressions. So let's try to avoid all of this just using Foocus. For this just add input image to Fooocus in Image Prompt tab with Advanced option enabled. After that drag & drop original portrait, select FaceSwap option and increase "Stop At" to 0.95 so it want change the face much and change Weight to 1-1.2 I will also change ration to landscape
![[Pasted image 20240702193548.png]]

Now update the prompt with activity you want and generate new image

Prompt: in pool party
![[Pasted image 20240702195857.png]]

It's hard for model to deal with multiple people/orcs, so let's change the prompt to `in pool`

Prompt: in pool
![[Pasted image 20240702200806.png]]

Now let's try to orc's skin tone. For that go to `Inpaint or Outpaint` tab, drop the image and go to `Advanced` -> `Developer Debug Mode` -> `Control` -> `Mixing Image Prompt and Inpaint` after that paint part you want and set `Method` -> `Improve Detail`
 or `Modify Content` depends on what you need
![[Pasted image 20240702201818.png]]

![[Pasted image 20240702202039.png]]

Now let's make few iterations to add tucks and ponytail as on original photo:....
Ok. At this point Google Colab crashed few times in a row, so I don't think I will be able to finish this 😢

So I would recommend to watch the first video from the [[Create images using Stable Diffusion#Some links]] for nice example and more tricks

# Summary
As a summary I can say few things:
- using [Juggernaut](https://civitai.com/models/133005/juggernaut-xl) model wasn't the best idea, should look for some fantasy specific models
- image generation is less about generating what you want exactly rather than generating whole bunch of different images and selecting the best one
- if you want to play around it's better to have nice GPU so you don't need to wait ~1 minute before image will be generated

# Some links
1. How to create AI influencer with Fooocus https://www.youtube.com/watch?v=oJkNtPk0DPw
2. UI that I've used for Stable Diffusion on top of Gradio https://github.com/lllyasviel/Fooocus
4. One more UI for Stable Diffusion on top of Gradio lib https://github.com/AUTOMATIC1111/stable-diffusion-webui
5. UI for advanced stable diffusion pipelines https://github.com/comfyanonymous/ComfyUI
6. How to run Stable Diffusion 3 locally using ComfyUI https://www.youtube.com/watch?v=9zfF7Jt-JnU
7. Stable Diffusion 3 Medium on Hugging Face https://huggingface.co/stabilityai/stable-diffusion-3-medium
8. Article with other useful links for Stable Diffusion https://stability.ai/news/stable-diffusion-public-release
9. Online version of Stable Diffusion XL 1.0 from stability.ai https://dreamstudio.ai/generate
10. Funny project to create pictures based on your scratches (Anime only) https://github.com/lllyasviel/style2paints/tree/master/V5_preview
11. Stable Diffusion Benchmarks: GPUs Compared https://www.tomshardware.com/pc-components/gpus/stable-diffusion-benchmarks
12. Site where you can find different LoRAs for Stable Diffusion https://civitai.com/models. Some random LoRAs I've found:
	1. https://civitai.com/models/333195/milfpeaches-ponyxl
	2. https://civitai.com/models/317902/t-ponynai3
	3. https://civitai.com/models/446067/virile-stallion
