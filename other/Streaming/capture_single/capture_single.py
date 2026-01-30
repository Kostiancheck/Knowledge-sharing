from windows_capture import WindowsCapture, Frame, InternalCaptureControl

def capture():

    # Initialize the capture session for the primary monitor
    # You can also use window_name="Your Window Title" to capture a specific app
    capture = WindowsCapture(
        monitor_index=None, 
        draw_border=False, 
        cursor_capture=True
    )

    @capture.event
    def on_frame_arrived(frame: Frame, capture_control: InternalCaptureControl):
        print(f"Frame captured: {frame.width}x{frame.height}")
        
        # Stop the capture after one frame
        capture_control.stop()

    @capture.event
    def on_closed():
        print("Capture session closed.")

    # Start the capture loop
    capture.start()

if __name__ == "__main__":
    capture()