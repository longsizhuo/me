import { useRef, useState, useEffect } from "react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

export const GlobalLottieBackground = () => {
    const [dotLottie, setDotLottie] = useState(null)
    const [isReady, setIsReady] = useState(false)
    const lastScrollY = useRef(0)
    const currentFrame = useRef(0)
    const scrollPerFrame = 20

    console.log("dotLottie", dotLottie)
    
    useEffect(() => {
        const waitForLoad = setInterval(() => {
            if (dotLottie?.isLoaded && dotLottie.totalFrames > 0) {
                setIsReady(true)
                clearInterval(waitForLoad)
            }
        }, 100)
        return () => clearInterval(waitForLoad)
    }, [dotLottie])

    useEffect(() => {
        if (!isReady || !dotLottie) return

        const handleScroll = () => {
            const deltaY = window.scrollY - lastScrollY.current
            lastScrollY.current = window.scrollY
            if (deltaY === 0) return

            const total = dotLottie.totalFrames
            const frameDelta = deltaY / scrollPerFrame
            let nextFrame = currentFrame.current + frameDelta
            nextFrame = ((nextFrame % total) + total) % total
            currentFrame.current = nextFrame
            dotLottie.setFrame(nextFrame)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [isReady, dotLottie])

    return (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
            <DotLottieReact
                dotLottieRefCallback={setDotLottie}
                src="https://lottie.host/a6ae4b17-1a57-416f-953d-c1d6794798d6/64AOvOtfsX.lottie"
                autoplay={false}
                loop={true}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    )
} 