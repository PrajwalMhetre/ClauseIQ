class PDFError(ValueError):
    pass


class PDFService:
    @staticmethod
    def validate_pdf(file_path: str, max_pages: int) -> int:
        try:
            import fitz
        except ImportError as exc:
            raise PDFError("PDF processing is unavailable: PyMuPDF is not installed.") from exc
        try:
            document = fitz.open(file_path)
            if document.needs_pass:
                raise PDFError("Encrypted PDFs are not supported.")
            page_count = document.page_count
            document.close()
        except PDFError:
            raise
        except Exception as exc:
            raise PDFError("The uploaded file is corrupted or is not a valid PDF.") from exc
        if page_count < 1:
            raise PDFError("The PDF contains no pages.")
        if page_count > max_pages:
            raise PDFError(f"PDF exceeds the {max_pages}-page limit.")
        return page_count

    @staticmethod
    def extract_text_by_page(file_path: str) -> list[dict]:
        try:
            import fitz
            document = fitz.open(file_path)
            if document.needs_pass:
                raise PDFError("Encrypted PDFs are not supported.")
            pages = [{"page_number": number + 1, "text": document.load_page(number).get_text("text").strip()}
                     for number in range(document.page_count)]
            document.close()
        except PDFError:
            raise
        except Exception as exc:
            raise PDFError("Unable to extract text from this PDF.") from exc
        if not any(page["text"] for page in pages):
            raise PDFError("No extractable text was found. This appears to be a scanned PDF; OCR is not configured.")
        return pages
