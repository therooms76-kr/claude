#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN

def create_presentation():
    # 프레젠테이션 객체 생성
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    # 1. 타이틀 슬라이드
    slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)

    title = slide.shapes.title
    subtitle = slide.placeholders[1]

    title.text = "Claude Code Test"
    subtitle.text = "Claude를 사용한 테스트 프로젝트"

    # 제목 서식 설정
    title.text_frame.paragraphs[0].font.size = Pt(44)
    title.text_frame.paragraphs[0].font.bold = True

    # 부제목 서식 설정
    subtitle.text_frame.paragraphs[0].font.size = Pt(32)

    # 2. 프로젝트 소개 슬라이드
    slide_layout = prs.slide_layouts[1]
    slide = prs.slides.add_slide(slide_layout)

    title = slide.shapes.title
    content = slide.placeholders[1]

    title.text = "프로젝트 개요"

    tf = content.text_frame
    tf.text = "Claude Code 테스트 프로젝트"

    p = tf.add_paragraph()
    p.text = "AI 기반 코드 생성 및 자동화"
    p.level = 1

    p = tf.add_paragraph()
    p.text = "PowerPoint 자동 생성 기능"
    p.level = 1

    p = tf.add_paragraph()
    p.text = "Python 기반 개발"
    p.level = 1

    # 3. 주요 기능 슬라이드
    slide_layout = prs.slide_layouts[1]
    slide = prs.slides.add_slide(slide_layout)

    title = slide.shapes.title
    content = slide.placeholders[1]

    title.text = "주요 기능"

    tf = content.text_frame
    tf.text = "자동화된 문서 생성"

    p = tf.add_paragraph()
    p.text = "코드 분석 및 이해"
    p.level = 0

    p = tf.add_paragraph()
    p.text = "프레젠테이션 자동 생성"
    p.level = 0

    p = tf.add_paragraph()
    p.text = "Git 통합 작업"
    p.level = 0

    # 4. 기술 스택 슬라이드
    slide_layout = prs.slide_layouts[1]
    slide = prs.slides.add_slide(slide_layout)

    title = slide.shapes.title
    content = slide.placeholders[1]

    title.text = "기술 스택"

    tf = content.text_frame
    tf.text = "Python 3.x"

    p = tf.add_paragraph()
    p.text = "python-pptx 라이브러리"
    p.level = 0

    p = tf.add_paragraph()
    p.text = "Git 버전 관리"
    p.level = 0

    p = tf.add_paragraph()
    p.text = "Claude AI 통합"
    p.level = 0

    # 5. 마무리 슬라이드
    slide_layout = prs.slide_layouts[5]
    slide = prs.slides.add_slide(slide_layout)

    title = slide.shapes.title
    title.text = "감사합니다!"

    # 저장
    prs.save('presentation.pptx')
    print("PowerPoint 파일이 성공적으로 생성되었습니다: presentation.pptx")

if __name__ == '__main__':
    create_presentation()
