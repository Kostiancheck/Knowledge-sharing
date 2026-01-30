import shutil
import os

shutil.rmtree("capture")

os.makedirs("capture")

os.system("ffmpeg -filter_complex \
           gfxcapture=monitor_idx=0:width=1920:height=1080:resize_mode=scale_aspect:output_fmt=8bit \
           -c:v hevc_nvenc -cq 30 \
           -f segment -segment_time 0.1 -g 6 -reset_timestamps 0 capture/capture%3d.mp4")
