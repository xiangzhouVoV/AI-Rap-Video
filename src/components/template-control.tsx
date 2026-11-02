"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ImageIcon, Play, SlidersHorizontal, X } from "lucide-react";
import { styles, variants } from "@/lib/content";
import ui from "./template-control.module.css";

type Props = {
  style: string;
  variant: string;
  disabled: boolean;
  onSelectStyle: (style: string) => void;
  onSelectVariant: (variant: string) => void;
  onNavigate: (style: string) => boolean;
};

export default function TemplateControl({ style, variant, disabled, onSelectStyle, onSelectVariant, onNavigate }: Props) {
  const [panel, setPanel] = useState<"preview" | "templates" | null>(null);
  const current = styles.find((item) => item.id === style) || styles[0];
  const scene = variants.find((item) => item.id === variant) || variants[0];
  const crowd = style === "crowd";

  return (
    <div className={ui.control}>
      <div className={ui.summary}>
        <img src={current.image} alt="" className={ui.thumbnail} />
        <div className={ui.summaryText}>
          <span className={ui.eyebrow}>CURRENT TEMPLATE</span>
          <strong>{current.title}</strong>
          <p>{crowd ? `Balcony + spotlight · ${scene.title}` : current.description}</p>
        </div>
        <span className={ui.photoCount}><ImageIcon size={12} /> {crowd ? "2 photos" : "1 photo"}</span>
      </div>
      <div className={ui.actions}>
        <button type="button" disabled={disabled} onClick={() => setPanel("preview")}>
          <Play size={13} /> Preview effect
        </button>
        <button type="button" disabled={disabled} onClick={() => setPanel("templates")}>
          <SlidersHorizontal size={13} /> Change template
        </button>
      </div>
      {panel && (
        <TemplateDialog title={panel === "preview" ? `${current.title} preview` : "Choose your template"} onClose={() => setPanel(null)}>
          {panel === "preview" ? (
            <>
              <div className={ui.preview}>
                {crowd ? (
                  <video src="/samples/crowd-preview.mp4" poster={current.image} controls playsInline preload="metadata" />
                ) : (
                  <img src={current.image} alt={`${current.title} visual style reference`} />
                )}
              </div>
              <p className={ui.description}>{crowd ? `${current.description} ${scene.description}` : current.description}</p>
              <p className={ui.note}>{crowd ? "Silent style preview" : "Still style reference"} · not your generated result. Your photos are used only after you click Generate.</p>
              <button type="button" className={`button-primary ${ui.continueButton}`} onClick={() => setPanel(null)}>Continue with {current.title}</button>
            </>
          ) : (
            <>
              <p className={ui.description}>Pick a look, then add your photo. Changing templates won’t start a video.</p>
              <div className={ui.choices}>
                {styles.map((item) => {
                  const selected = item.id === style;
                  const changesPage = (item.id === "crowd") !== crowd;
                  const content = <>
                    <img src={item.image} alt="" />
                    <span className={ui.choiceText}><strong>{item.title}</strong><small>{item.id === "crowd" ? "2 photos · balcony + spotlight" : "1 photo · your portrait"}</small></span>
                    <span className={ui.choiceIcon}>{selected ? <Check size={15} /> : changesPage ? <ArrowUpRight size={15} /> : <span />}</span>
                  </>;
                  return changesPage ? (
                    <Link key={item.id} className={ui.choice} href={item.id === "crowd" ? "/i-found-you-in-the-crowd#create" : "/#create"} aria-disabled={disabled} onNavigate={(event) => {
                      if (disabled || !onNavigate(item.id)) { event.preventDefault(); setPanel(null); }
                      else setPanel(null);
                    }}>{content}</Link>
                  ) : (
                    <button key={item.id} type="button" disabled={disabled} aria-pressed={selected} className={`${ui.choice} ${selected ? ui.selected : ""}`} onClick={() => {
                      onSelectStyle(item.id);
                      setPanel(null);
                    }}>{content}</button>
                  );
                })}
              </div>
              {crowd && <div className={ui.scenes}>
                <p className={ui.eyebrow}>MAKE THIS SCENE YOURS</p>
                <div className={ui.sceneChoices}>
                  {variants.map((item) => <button key={item.id} type="button" disabled={disabled} aria-pressed={variant === item.id} className={variant === item.id ? ui.selected : ""} onClick={() => {
                    onSelectVariant(item.id);
                    setPanel(null);
                  }}>
                    <span>{item.title}</span>{variant === item.id && <Check size={14} />}
                  </button>)}
                </div>
              </div>}
              <p className={ui.note}>Your uploaded photo carries over. I Found You needs two photos; other templates use one.</p>
            </>
          )}
        </TemplateDialog>
      )}
    </div>
  );
}

function TemplateDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return <dialog ref={ref} className={ui.dialog} aria-labelledby={titleId} onCancel={onClose} onClick={(event) => {
    if (event.target === event.currentTarget) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }
  }}>
    <div className={ui.dialogHeader}>
      <h2 id={titleId}>{title}</h2>
      <button type="button" aria-label="Close template dialog" onClick={onClose}><X size={20} /></button>
    </div>
    {children}
  </dialog>;
}
