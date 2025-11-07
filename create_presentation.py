#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Claude Code Test - 제품 소개서 파워포인트 생성 스크립트
짙은 푸른색 계열의 전문적인 디자인
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor

# 색상 정의 (짙은 푸른색 계열)
DARK_NAVY = RGBColor(10, 35, 66)  # #0A2342
NAVY_BLUE = RGBColor(27, 58, 87)  # #1B3A57
ROYAL_BLUE = RGBColor(30, 144, 255)  # #1E90FF
STEEL_BLUE = RGBColor(65, 105, 225)  # #4169E1
LIGHT_BLUE = RGBColor(100, 149, 237)  # #6495ED
WHITE = RGBColor(255, 255, 255)
LIGHT_GRAY = RGBColor(220, 220, 220)

def add_title_slide(prs):
    """타이틀 슬라이드"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # 빈 레이아웃

    # 배경 설정
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = DARK_NAVY

    # 메인 타이틀
    title_box = slide.shapes.add_textbox(Inches(1), Inches(2.5), Inches(8), Inches(1))
    title_frame = title_box.text_frame
    title_frame.text = "Claude Code Test"
    title_para = title_frame.paragraphs[0]
    title_para.font.size = Pt(60)
    title_para.font.bold = True
    title_para.font.color.rgb = WHITE
    title_para.alignment = PP_ALIGN.CENTER

    # 서브타이틀
    subtitle_box = slide.shapes.add_textbox(Inches(1), Inches(3.8), Inches(8), Inches(0.6))
    subtitle_frame = subtitle_box.text_frame
    subtitle_frame.text = "AI 기반 코드 작성 및 프로젝트 관리 솔루션"
    subtitle_para = subtitle_frame.paragraphs[0]
    subtitle_para.font.size = Pt(24)
    subtitle_para.font.color.rgb = LIGHT_BLUE
    subtitle_para.alignment = PP_ALIGN.CENTER

    # 장식 라인
    line = slide.shapes.add_shape(1, Inches(2.5), Inches(4.5), Inches(5), Inches(0))
    line.fill.solid()
    line.fill.fore_color.rgb = ROYAL_BLUE
    line.line.color.rgb = ROYAL_BLUE
    line.line.width = Pt(3)

def add_section_slide(prs, title_text):
    """섹션 구분 슬라이드"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    # 배경
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = NAVY_BLUE

    # 타이틀
    title_box = slide.shapes.add_textbox(Inches(1), Inches(3), Inches(8), Inches(1.5))
    title_frame = title_box.text_frame
    title_frame.text = title_text
    title_para = title_frame.paragraphs[0]
    title_para.font.size = Pt(48)
    title_para.font.bold = True
    title_para.font.color.rgb = WHITE
    title_para.alignment = PP_ALIGN.CENTER

def add_content_slide(prs, title_text, content_items, icon=""):
    """콘텐츠 슬라이드"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    # 배경
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = DARK_NAVY

    # 상단 헤더 박스
    header = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(10), Inches(1.2))
    header.fill.solid()
    header.fill.fore_color.rgb = NAVY_BLUE
    header.line.fill.background()

    # 타이틀
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(9), Inches(0.6))
    title_frame = title_box.text_frame
    if icon:
        title_frame.text = f"{icon} {title_text}"
    else:
        title_frame.text = title_text
    title_para = title_frame.paragraphs[0]
    title_para.font.size = Pt(36)
    title_para.font.bold = True
    title_para.font.color.rgb = WHITE

    # 콘텐츠 박스
    content_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(8.4), Inches(5))
    text_frame = content_box.text_frame
    text_frame.word_wrap = True

    for i, item in enumerate(content_items):
        if isinstance(item, tuple):
            heading, details = item
            # 헤딩
            p = text_frame.paragraphs[0] if i == 0 else text_frame.add_paragraph()
            p.text = heading
            p.font.size = Pt(20)
            p.font.bold = True
            p.font.color.rgb = ROYAL_BLUE
            p.space_after = Pt(6)

            # 상세 내용
            for detail in details:
                p = text_frame.add_paragraph()
                p.text = detail
                p.font.size = Pt(16)
                p.font.color.rgb = WHITE
                p.level = 1
                p.space_after = Pt(8)
        else:
            # 단순 텍스트
            p = text_frame.paragraphs[0] if i == 0 else text_frame.add_paragraph()
            p.text = item
            p.font.size = Pt(18)
            p.font.color.rgb = WHITE
            p.space_after = Pt(12)

def create_presentation():
    """프레젠테이션 생성"""
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    # 1. 타이틀 슬라이드
    add_title_slide(prs)

    # 2. 제품 개요
    add_content_slide(prs, "제품 개요", [
        "Claude Code Test는 Claude AI를 활용한 혁신적인 개발 솔루션입니다.",
        "",
        "• AI 기반 코드 생성 및 분석",
        "• 지능형 프로젝트 관리",
        "• 자동화된 워크플로우",
        "• 실시간 코드 개선 제안"
    ], "📋")

    # 3. 섹션 - 주요 기능
    add_section_slide(prs, "주요 기능")

    # 4. AI 기반 코드 생성
    add_content_slide(prs, "AI 기반 코드 생성", [
        ("🤖 Claude AI 엔진", [
            "• 최신 Claude Sonnet 4.5 모델 탑재",
            "• 다양한 프로그래밍 언어 지원",
            "• 컨텍스트 기반 지능형 코드 제안"
        ]),
        ("💡 스마트 코딩", [
            "• 자연어로 코드 생성",
            "• 실시간 코드 리뷰 및 개선",
            "• 보안 취약점 자동 감지"
        ])
    ])

    # 5. 프로젝트 관리
    add_content_slide(prs, "프로젝트 관리", [
        ("🔄 Git 통합", [
            "• 완벽한 Git 워크플로우 지원",
            "• 자동 브랜치 관리",
            "• 스마트 커밋 및 푸시"
        ]),
        ("📊 작업 추적", [
            "• 실시간 작업 진행 상황 모니터링",
            "• 자동 Todo 리스트 관리",
            "• 병렬 작업 처리"
        ])
    ])

    # 6. 코드 분석 및 검색
    add_content_slide(prs, "코드 분석 및 검색", [
        ("🔍 강력한 검색", [
            "• 정규표현식 기반 코드 검색",
            "• 패턴 매칭 및 파일 탐색",
            "• 프로젝트 구조 자동 분석"
        ]),
        ("📈 코드 인사이트", [
            "• 의존성 분석",
            "• 코드 품질 평가",
            "• 리팩토링 제안"
        ])
    ])

    # 7. 자동화 기능
    add_content_slide(prs, "자동화 기능", [
        ("⚡ 워크플로우 자동화", [
            "• 반복 작업 자동화",
            "• 테스트 자동 실행",
            "• CI/CD 파이프라인 통합"
        ]),
        ("🛠 개발 도구", [
            "• 빌드 프로세스 최적화",
            "• 에러 자동 수정",
            "• 문서 자동 생성"
        ])
    ])

    # 8. 섹션 - 기술 스택
    add_section_slide(prs, "기술 스택")

    # 9. 기술 스택 상세
    add_content_slide(prs, "기술 스택", [
        ("🧠 AI 엔진", [
            "• Claude Sonnet 4.5 (최신 모델)",
            "• 고급 자연어 처리",
            "• 멀티모달 분석 지원"
        ]),
        ("💻 개발 환경", [
            "• Linux 기반 시스템",
            "• Git 버전 관리",
            "• 다양한 프로그래밍 언어 지원"
        ])
    ])

    # 10. 사용 사례
    add_content_slide(prs, "사용 사례", [
        "1️⃣  코드 리뷰 자동화",
        "   → AI가 코드를 분석하고 개선 사항 제안",
        "",
        "2️⃣  문서 자동 생성",
        "   → README, API 문서 자동 작성",
        "",
        "3️⃣  버그 수정",
        "   → 자동 버그 감지 및 수정 방안 제시",
        "",
        "4️⃣  코드 리팩토링",
        "   → 코드 품질 개선 및 최적화"
    ])

    # 11. 워크플로우
    add_content_slide(prs, "개발 워크플로우", [
        ("📝 단계별 프로세스", [
            "1. 계획 수립 - 작업 분석 및 단계별 계획",
            "2. 구현 - AI 기반 코드 작성 및 수정",
            "3. 테스트 - 자동 테스트 실행 및 검증",
            "4. 리뷰 - 코드 품질 검토",
            "5. 배포 - 변경사항 커밋 및 푸시"
        ])
    ])

    # 12. 보안
    add_content_slide(prs, "보안", [
        ("🔒 보안 기능", [
            "• OWASP Top 10 취약점 자동 검사",
            "• SQL Injection 방지",
            "• XSS 공격 차단",
            "• 안전한 코드 생성 원칙 준수"
        ]),
        ("✅ 보안 모범 사례", [
            "• 정기적인 보안 감사",
            "• 민감 정보 자동 감지",
            "• 안전한 의존성 관리"
        ])
    ])

    # 13. 시작하기
    add_content_slide(prs, "시작하기", [
        ("🚀 설치 방법", [
            "# 저장소 클론",
            "git clone https://github.com/therooms76-kr/claude.git",
            "",
            "# 프로젝트 디렉토리로 이동",
            "cd claude",
            "",
            "# 의존성 설치",
            "npm install  # 또는 pip install -r requirements.txt"
        ])
    ])

    # 14. 향후 계획
    add_content_slide(prs, "향후 계획", [
        "🎯  더 많은 프로그래밍 언어 지원",
        "",
        "🎯  향상된 AI 모델 통합",
        "",
        "🎯  실시간 협업 기능",
        "",
        "🎯  클라우드 통합",
        "",
        "🎯  성능 최적화 및 확장성 개선"
    ])

    # 15. 마무리 슬라이드
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = DARK_NAVY

    # 감사 메시지
    thanks_box = slide.shapes.add_textbox(Inches(1), Inches(2.5), Inches(8), Inches(1))
    thanks_frame = thanks_box.text_frame
    thanks_frame.text = "감사합니다"
    thanks_para = thanks_frame.paragraphs[0]
    thanks_para.font.size = Pt(54)
    thanks_para.font.bold = True
    thanks_para.font.color.rgb = WHITE
    thanks_para.alignment = PP_ALIGN.CENTER

    # 부제
    sub_box = slide.shapes.add_textbox(Inches(1), Inches(3.8), Inches(8), Inches(0.8))
    sub_frame = sub_box.text_frame
    sub_frame.text = "Claude Code Test와 함께 더 스마트한 개발을 경험하세요"
    sub_para = sub_frame.paragraphs[0]
    sub_para.font.size = Pt(20)
    sub_para.font.color.rgb = LIGHT_BLUE
    sub_para.alignment = PP_ALIGN.CENTER

    # GitHub 링크
    github_box = slide.shapes.add_textbox(Inches(1), Inches(5.2), Inches(8), Inches(0.5))
    github_frame = github_box.text_frame
    github_frame.text = "github.com/therooms76-kr/claude"
    github_para = github_frame.paragraphs[0]
    github_para.font.size = Pt(18)
    github_para.font.color.rgb = ROYAL_BLUE
    github_para.alignment = PP_ALIGN.CENTER

    # 크레딧
    credit_box = slide.shapes.add_textbox(Inches(1), Inches(6.5), Inches(8), Inches(0.4))
    credit_frame = credit_box.text_frame
    credit_frame.text = "Made with ❤️ by Claude AI"
    credit_para = credit_frame.paragraphs[0]
    credit_para.font.size = Pt(14)
    credit_para.font.color.rgb = LIGHT_GRAY
    credit_para.alignment = PP_ALIGN.CENTER

    # 파일 저장
    prs.save('Claude_Code_Product_Introduction.pptx')
    print("✅ 파워포인트 프레젠테이션이 성공적으로 생성되었습니다!")
    print("📄 파일명: Claude_Code_Product_Introduction.pptx")

if __name__ == "__main__":
    create_presentation()
