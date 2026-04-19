#!/usr/bin/env python3
import os
import sys
import json
import base64
import anthropic
import requests


def generate_blog_post(topic=None):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    if topic:
        user_message = f"다음 주제로 블로그 포스트를 작성해주세요: {topic}"
    else:
        user_message = "오늘 날짜를 기반으로 흥미로운 기술 트렌드나 일상 관련 블로그 포스트를 작성해주세요."

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        system="""당신은 raonlog.com 블로그의 전문 작가입니다.
블로그 포스트를 작성할 때 반드시 아래 형식의 JSON만 응답하세요 (다른 텍스트 없이):
{
  "title": "포스트 제목",
  "content": "HTML 형식의 포스트 내용"
}

작성 규칙:
- 한국어로 작성
- content는 HTML 태그 사용 (<h2>, <p>, <ul>, <li>, <strong> 등)
- 서론 → 본론(2~3개 <h2> 섹션) → 결론 구조
- 분량: 800~1500자""",
        messages=[{"role": "user", "content": user_message}],
    )

    text = response.content[0].text.strip()

    # JSON 블록 추출 (코드 펜스 처리)
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    try:
        data = json.loads(text)
        return data["title"], data["content"]
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON 파싱 실패: {e}", file=sys.stderr)
        print(f"원본 응답:\n{text}", file=sys.stderr)
        # 폴백: 첫 줄을 제목, 나머지를 본문으로
        lines = text.split("\n")
        title = lines[0].lstrip("#").strip() if lines else "새 포스트"
        body = "\n".join(lines[1:]).strip() if len(lines) > 1 else text
        return title, f"<p>{body}</p>"


def post_to_wordpress(title, content):
    domain = os.environ.get("WP_DOMAIN", "raonlog.com")
    username = os.environ["WP_USERNAME"]
    app_password = os.environ["WP_APP_PASSWORD"]

    wp_url = f"https://{domain}/wp-json/wp/v2/posts"

    credentials = f"{username}:{app_password}"
    token = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")

    headers = {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
    }

    payload = {
        "title": title,
        "content": content,
        "status": "publish",
    }

    response = requests.post(wp_url, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    result = response.json()

    print(f"포스트 게시 완료!")
    print(f"  제목: {title}")
    print(f"  URL : {result.get('link', 'N/A')}")
    print(f"  ID  : {result.get('id', 'N/A')}")
    return result


if __name__ == "__main__":
    topic = os.environ.get("BLOG_TOPIC", "").strip()

    print("블로그 포스트 생성 중...")
    title, content = generate_blog_post(topic if topic else None)
    print(f"  생성된 제목: {title}")

    print("WordPress에 포스팅 중...")
    post_to_wordpress(title, content)
