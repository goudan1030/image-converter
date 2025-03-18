'use client';

import React, { useRef } from 'react';
import { Button } from "./button";
import { ArrowRight } from "lucide-react";

// 为Window对象声明AestheticFluidBg属性
declare global {
  interface Window {
    AestheticFluidBg?: any;
  }
}

interface BannerProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
  videoSrc?: string;
}

export function Banner({ onGetStarted, onLearnMore, videoSrc = '/videos/banner-bg.webm' }: BannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* 视频背景 */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 object-cover w-full h-full"
          autoPlay
          muted
          loop
          playsInline
          src={videoSrc}
        >
          <source src={videoSrc} type="video/webm" />
          您的浏览器不支持视频标签
        </video>
      </div>
      
      {/* 内容区域 */}
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Powerful Image Processing Tool<br />
            <span className="text-white">Simple to Use</span>
          </h1>
          <p className="text-xl text-white md:text-2xl mb-8">
            Easily compress, convert and process images in your browser, no software installation required
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="text-lg" onClick={onGetStarted}>
              Start Processing <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg bg-white/10 text-white border-white hover:bg-white/20 hover:text-white" onClick={onLearnMore}>
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
} 