# User-Supplied YouTube Resources — Manifest Only

**Source type:** URLs supplied by the user  
**Transcript status:** Not transcribed or independently verified in this pack  
**Important:** Do not claim the system has watched, read, or indexed these videos based on their URLs alone.

## Resources

1. Video: https://youtu.be/a-yuXz_uV30
2. Playlist: https://youtube.com/playlist?list=PLahhVEj9XNTd6H2vpsvm_kBSMsMw9EMUL
3. Playlist: https://youtube.com/playlist?list=PLGjZwEtPN7j-Q59JYso3L4_yoCjj2syrM
4. Video: https://youtu.be/5abffC-K40c

## Safe workflow for adding video knowledge

1. Open the video and use YouTube's transcript feature if captions are available.
2. Produce concise study notes rather than republishing a full transcript.
3. Review technical claims against current Microsoft Learn documentation.
4. Save each reviewed note as its own Markdown file, with the video URL, verified title, topics, date reviewed, and official sources used for validation.
5. Add only the reviewed note file to the RAG index. Do not treat a playlist URL as transcript content.
6. If a transcript is unavailable, label the resource `not_transcribed`; do not invent a summary.

## Metadata template for future verified notes

```yaml
source_id: video-note-001
source_type: video_notes
source_url: "PASTE_THE_EXACT_VIDEO_URL"
source_title: "Only add after verifying"
date_reviewed: "YYYY-MM-DD"
verification_status: "verified_note"
topics:
  - "AZ-900 domain/topic"
official_validation_urls:
  - "https://learn.microsoft.com/..."
```

## Technical note

Gemini File Search supports text/document-oriented RAG ingestion, not direct ingestion of video or audio as a substitute for text notes. A video-understanding model may be used to help draft notes from a public YouTube URL, but the resulting notes still need review and ingestion as text.
