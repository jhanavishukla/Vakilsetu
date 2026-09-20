import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    
    # Premium Color Palette
    BG_COLOR = RGBColor(15, 23, 42)          # Deep Slate Dark #0f172a
    CARD_BG_COLOR = RGBColor(22, 28, 45)     # Card Background
    ACCENT_CYAN = RGBColor(6, 182, 212)      # Electric Cyan #06b6d4
    ACCENT_INDIGO = RGBColor(99, 102, 241)   # Neon Indigo #6366f1
    TEXT_PRIMARY = RGBColor(248, 250, 252)    # Clean White #f8fafc
    TEXT_MUTED = RGBColor(148, 163, 184)      # Soft Gray #94a3b8
    ACCENT_ORANGE = RGBColor(249, 115, 22)    # Terracotta orange #f97316
    LEADER_BG = RGBColor(30, 41, 59)          # Leader Card highlight
    ACCENT_EMERALD = RGBColor(16, 185, 129)  # Emerald Green
    ACCENT_AMBER = RGBColor(245, 158, 11)     # Amber Yellow
    
    blank_layout = prs.slide_layouts[6]
    
    def set_slide_bg_and_header(slide, title_text, category_text="VAKILSETU"):
        # Dark Background
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = BG_COLOR
        
        # Sleek Neon Header Accent Bar (Top Border)
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.33), Inches(0.06))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = ACCENT_CYAN
        top_bar.line.fill.background()
        
        # Category Tracker Label
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        cat_tf = cat_box.text_frame
        cat_tf.word_wrap = True
        cat_p = cat_tf.paragraphs[0]
        cat_p.text = category_text.upper()
        cat_p.font.name = "Consolas"
        cat_p.font.size = Pt(11)
        cat_p.font.bold = True
        cat_p.font.color.rgb = ACCENT_INDIGO
        
        # Main Slide Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.65), Inches(11.7), Inches(0.8))
        title_tf = title_box.text_frame
        title_tf.word_wrap = True
        title_p = title_tf.paragraphs[0]
        title_p.text = title_text
        title_p.font.name = "Segoe UI"
        title_p.font.size = Pt(28)
        title_p.font.bold = True
        title_p.font.color.rgb = TEXT_PRIMARY

    # ====================================================
    # SLIDE 1: Title Slide (High Impact Cover)
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BG_COLOR
    
    stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.12), Inches(7.5))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = ACCENT_CYAN
    stripe.line.fill.background()
    
    title_box = slide.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(11.0), Inches(2.2))
    tf = title_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "VAKILSETU"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(72)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_CYAN
    
    p2 = tf.add_paragraph()
    p2.text = "Legal Help Made Accessible"
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(24)
    p2.font.color.rgb = ACCENT_INDIGO
    p2.space_before = Pt(6)
    
    meta_box = slide.shapes.add_textbox(Inches(1.2), Inches(4.3), Inches(11.0), Inches(2.5))
    meta_tf = meta_box.text_frame
    meta_tf.word_wrap = True
    
    fields = [
        ("Team Name", "[Enter your Team Name]"),
        ("Team Leader Name", "[Enter Team Leader Name]"),
        ("Problem Statement", "Providing legal help to everyone by translating complex jargon, offering flat-rate pricing transparency, and validating licenses automatically.")
    ]
    
    for label, val in fields:
        p = meta_tf.add_paragraph()
        run1 = p.add_run()
        run1.text = f"{label.upper()} // "
        run1.font.name = "Consolas"
        run1.font.size = Pt(12)
        run1.font.bold = True
        run1.font.color.rgb = ACCENT_CYAN
        
        run2 = p.add_run()
        run2.text = val
        run2.font.name = "Segoe UI"
        run2.font.size = Pt(13)
        run2.font.color.rgb = TEXT_PRIMARY
        p.space_after = Pt(10)

    # ====================================================
    # SLIDE 2: Team Members
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg_and_header(slide, "Meet Our Team", "CODERUSH 2.0")
    
    leader_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.8))
    leader_card.fill.solid()
    leader_card.fill.fore_color.rgb = LEADER_BG
    leader_card.line.color.rgb = ACCENT_INDIGO
    leader_card.line.width = Pt(1.5)
    
    tf = leader_card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "TEAM LEADER"
    p.font.name = "Consolas"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(14)
    
    for f in ["Name: [Leader Name]", "College: [College Name]", "LinkedIn: [Profile Link]"]:
        p = tf.add_paragraph()
        p.text = f
        p.font.name = "Segoe UI"
        p.font.size = Pt(14)
        p.font.color.rgb = TEXT_PRIMARY
        p.space_after = Pt(10)
        
    mx = [Inches(4.8), Inches(8.8), Inches(4.8), Inches(8.8)]
    my = [Inches(1.8), Inches(1.8), Inches(4.3), Inches(4.3)]
    
    for i in range(4):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, mx[i], my[i], Inches(3.7), Inches(2.3))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG_COLOR
        card.line.color.rgb = RGBColor(51, 65, 85)
        
        tf = card.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"TEAM MEMBER 0{i+1}"
        p.font.name = "Consolas"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_INDIGO
        p.space_after = Pt(8)
        
        for f in ["Name: [Member Name]", "College: [College Name]", "LinkedIn: [Profile Link]"]:
            p = tf.add_paragraph()
            p.text = f
            p.font.name = "Segoe UI"
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_PRIMARY
            p.space_after = Pt(4)

    # ====================================================
    # SLIDE 3: Brief about the Idea
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg_and_header(slide, "Brief about the Idea", "THE CONCEPT")
    
    fx = [Inches(0.8), Inches(4.8), Inches(8.8)]
    feats = [
        ("01", "AI INTAKE & NLP EXTRACTION", "Speech-to-text intake in local languages (EN/HI/MR). An NLP model (Claude) classifies the practice area and extracts key entities (dispute amount, city, dates) which are processed by deterministic backend formulas to compute viability and filing costs."),
        ("02", "TRANSPARENT MATCHMAKER", "Say goodbye to hidden rates. Clients search and browse lawyer directories utilizing verifiable past-case track records, user star reviews, and upfront flat-fee legal service packages."),
        ("03", "SECURE CASE WORKSPACE", "Unlocks a privilege-protected timeline workspace containing direct secure chat, litigation phase trackers, and an AI Clause Auditor flagging predatory terms in PDF contracts.")
    ]
    
    for i, (num, title, desc) in enumerate(feats):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, fx[i], Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG_COLOR
        card.line.color.rgb = ACCENT_CYAN if i == 0 else RGBColor(51, 65, 85)
        card.line.width = Pt(1.5) if i == 0 else Pt(1)
        
        tf = card.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = num
        p.font.name = "Consolas"
        p.font.size = Pt(36)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN if i == 0 else ACCENT_INDIGO
        p.space_after = Pt(8)
        
        p2 = tf.add_paragraph()
        p2.text = title
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(14)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_PRIMARY
        p2.space_after = Pt(12)
        
        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.name = "Segoe UI"
        p3.font.size = Pt(12.5)
        p3.font.color.rgb = TEXT_MUTED
        p3.line_spacing = 1.3

    # ====================================================
    # SLIDE 4: Opportunity & USP
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg_and_header(slide, "Opportunity, Solve & USP", "MARKET ADVANTAGE")
    
    left_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = CARD_BG_COLOR
    left_card.line.color.rgb = RGBColor(51, 65, 85)
    
    tf = left_card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "HOW WE SOLVE THE PROBLEM"
    p.font.name = "Consolas"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_INDIGO
    p.space_after = Pt(14)
    
    solves = [
        "Jargon-Free Analysis: Simplifies complex contracts and laws into transparent guides.",
        "Pricing Integrity: Mandates flat-rate packages, ending unpredictable billable hours.",
        "Verified Profiles: Integrates DigiLocker IDs and runs sanity checks on credentials."
    ]
    for s in solves:
        p = tf.add_paragraph()
        p.text = chr(9656) + " " + s
        p.font.name = "Segoe UI"
        p.font.size = Pt(12.5)
        p.font.color.rgb = TEXT_PRIMARY
        p.space_after = Pt(12)
        p.line_spacing = 1.25

    right_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(4.8))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = CARD_BG_COLOR
    right_card.line.color.rgb = ACCENT_CYAN
    right_card.line.width = Pt(1.5)
    
    tf = right_card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "UNIQUE SELLING POINT (USP)"
    p.font.name = "Consolas"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(14)
    
    usps = [
        "Intake-to-Audit Continuity: Unified flow from diagnostic voice intake to matching and remote contract scans in a secure workspace.",
        "Automated Credentials Stamp: Restricts new advocates to 'Pending Verification' until digital audits pass.",
        "Role-Tailored Portals: Dynamic toggling between Client view and Advocate caseload dashboard."
    ]
    for u in usps:
        p = tf.add_paragraph()
        p.text = chr(9656) + " " + u
        p.font.name = "Segoe UI"
        p.font.size = Pt(12.5)
        p.font.color.rgb = TEXT_PRIMARY
        p.space_after = Pt(12)
        p.line_spacing = 1.25

    # ====================================================
    # SLIDE 5: Process Flow Diagram (Matching the User's Image Format)
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg_and_header(slide, "VakilSetu Process Flow Chart", "PROCESS FLOW")
    
    def format_shape_text(shape, text, font_size=10, bold=False, color=TEXT_PRIMARY, font_name="Segoe UI"):
        tf = shape.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = text
        p.font.name = font_name
        p.font.size = Pt(font_size)
        p.font.bold = bold
        p.font.color.rgb = color

    # --- TOP INPUTS & INSPECTION ---
    # 1. RM Receipt -> Client Case Text Input (Oval - Emerald Green)
    sh_rm = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(4.5), Inches(1.3), Inches(2.2), Inches(0.45))
    sh_rm.fill.solid()
    sh_rm.fill.fore_color.rgb = ACCENT_EMERALD
    sh_rm.line.fill.background()
    format_shape_text(sh_rm, "Client Case Text Input", 9.5, True)
    
    # 2. BOP Receipt -> Document/Voice Input (Oval - Emerald Green)
    sh_bop = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(8.0), Inches(1.9), Inches(2.2), Inches(0.45))
    sh_bop.fill.solid()
    sh_bop.fill.fore_color.rgb = ACCENT_EMERALD
    sh_bop.line.fill.background()
    format_shape_text(sh_bop, "Voice/Doc Input", 9.5, True)

    # 3. Inspection -> AI Entity NLP Extraction (Box - Indigo)
    sh_insp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), Inches(1.9), Inches(2.2), Inches(0.45))
    sh_insp.fill.solid()
    sh_insp.fill.fore_color.rgb = ACCENT_INDIGO
    sh_insp.line.fill.background()
    format_shape_text(sh_insp, "AI NLP Extraction", 9.5, True)
    
    # Document Note next to Inspection: Receiving Inspection Report -> NLP Parse Log
    sh_insp_doc = slide.shapes.add_shape(MSO_SHAPE.FOLDED_CORNER, Inches(2.8), Inches(1.85), Inches(1.2), Inches(0.55))
    sh_insp_doc.fill.solid()
    sh_insp_doc.fill.fore_color.rgb = CARD_BG_COLOR
    sh_insp_doc.line.color.rgb = TEXT_MUTED
    format_shape_text(sh_insp_doc, "NLP Entity List", 8, False, TEXT_MUTED, "Consolas")

    # Arrow from BOP -> Inspection
    arr_bop_insp = slide.shapes.add_shape(MSO_SHAPE.LEFT_ARROW, Inches(7.0), Inches(2.02), Inches(0.7), Inches(0.2))
    arr_bop_insp.fill.solid()
    arr_bop_insp.fill.fore_color.rgb = TEXT_MUTED
    arr_bop_insp.line.fill.background()

    # Arrow from RM -> Inspection
    arr_rm_insp = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(5.5), Inches(1.77), Inches(0.2), Inches(0.12))
    arr_rm_insp.fill.solid()
    arr_rm_insp.fill.fore_color.rgb = TEXT_MUTED
    arr_rm_insp.line.fill.background()

    # --- FIRST DECISION ---
    # 4. Material OK or Not? -> Is Case Viable? (Orange Diamond)
    sh_dec1 = slide.shapes.add_shape(MSO_SHAPE.DIAMOND, Inches(4.3), Inches(2.55), Inches(2.6), Inches(0.8))
    sh_dec1.fill.solid()
    sh_dec1.fill.fore_color.rgb = ACCENT_ORANGE
    sh_dec1.line.fill.background()
    format_shape_text(sh_dec1, "Is Case Viable?\n(Score > 50%)", 9, True)

    # Arrow from Inspection -> Decision 1
    arr_insp_dec1 = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(5.5), Inches(2.37), Inches(0.2), Inches(0.16))
    arr_insp_dec1.fill.solid()
    arr_insp_dec1.fill.fore_color.rgb = TEXT_MUTED
    arr_insp_dec1.line.fill.background()

    # Left branch: Not OK -> Send to supplier -> Route to Self-Help Library
    sh_l_arr1 = slide.shapes.add_shape(MSO_SHAPE.LEFT_ARROW, Inches(3.2), Inches(2.85), Inches(0.9), Inches(0.2))
    sh_l_arr1.fill.solid()
    sh_l_arr1.fill.fore_color.rgb = ACCENT_ORANGE
    sh_l_arr1.line.fill.background()
    # Left Arrow Label: Not OK
    tb_not_ok1 = slide.shapes.add_textbox(Inches(3.3), Inches(2.55), Inches(0.8), Inches(0.3))
    tb_not_ok1.text_frame.paragraphs[0].text = "Not OK"
    tb_not_ok1.text_frame.paragraphs[0].font.size = Pt(8.5)
    tb_not_ok1.text_frame.paragraphs[0].font.bold = True
    tb_not_ok1.text_frame.paragraphs[0].font.color.rgb = ACCENT_ORANGE

    sh_not_ok_oval = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.8), Inches(2.72), Inches(2.2), Inches(0.45))
    sh_not_ok_oval.fill.solid()
    sh_not_ok_oval.fill.fore_color.rgb = ACCENT_EMERALD
    sh_not_ok_oval.line.fill.background()
    format_shape_text(sh_not_ok_oval, "Route to Self-Help", 9.5, True)
    
    # Document Note next to "Send to supplier"
    sh_not_ok_doc = slide.shapes.add_shape(MSO_SHAPE.FOLDED_CORNER, Inches(0.8), Inches(1.9), Inches(1.0), Inches(0.55))
    sh_not_ok_doc.fill.solid()
    sh_not_ok_doc.fill.fore_color.rgb = CARD_BG_COLOR
    sh_not_ok_doc.line.color.rgb = TEXT_MUTED
    format_shape_text(sh_not_ok_doc, "Self-Help Playbook", 8, False, TEXT_MUTED)

    # --- INTERMEDIATE STEP ---
    # 5. Material Storage -> Advocate Directory Matches (Yellow Triangle)
    sh_store = slide.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE, Inches(4.5), Inches(3.6), Inches(2.2), Inches(0.65))
    sh_store.fill.solid()
    sh_store.fill.fore_color.rgb = ACCENT_AMBER
    sh_store.line.fill.background()
    format_shape_text(sh_store, "\nAdvocate matches", 9, True)

    # Arrow from Decision 1 -> Storage
    arr_dec1_store = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(5.5), Inches(3.37), Inches(0.2), Inches(0.21))
    arr_dec1_store.fill.solid()
    arr_dec1_store.fill.fore_color.rgb = ACCENT_EMERALD
    arr_dec1_store.line.fill.background()
    # Label: OK
    tb_ok1 = slide.shapes.add_textbox(Inches(5.7), Inches(3.32), Inches(0.4), Inches(0.3))
    tb_ok1.text_frame.paragraphs[0].text = "OK"
    tb_ok1.text_frame.paragraphs[0].font.size = Pt(8.5)
    tb_ok1.text_frame.paragraphs[0].font.bold = True
    tb_ok1.text_frame.paragraphs[0].font.color.rgb = ACCENT_EMERALD

    # --- MAIN STAGE ---
    # 6. Production -> Consultation & Onboarding (Amber Box)
    sh_prod = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.5), Inches(4.5), Inches(2.2), Inches(0.45))
    sh_prod.fill.solid()
    sh_prod.fill.fore_color.rgb = ACCENT_AMBER
    sh_prod.line.fill.background()
    format_shape_text(sh_prod, "Consultation & OTP Onboarding", 9, True, BG_COLOR)

    # Arrow from Storage -> Production
    arr_store_prod = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(5.5), Inches(4.27), Inches(0.2), Inches(0.21))
    arr_store_prod.fill.solid()
    arr_store_prod.fill.fore_color.rgb = TEXT_MUTED
    arr_store_prod.line.fill.background()

    # --- SECOND DECISION ---
    # 7. Are the parts ok? -> Is OTP Verified? (Orange Diamond)
    sh_dec2 = slide.shapes.add_shape(MSO_SHAPE.DIAMOND, Inches(4.3), Inches(5.2), Inches(2.6), Inches(0.8))
    sh_dec2.fill.solid()
    sh_dec2.fill.fore_color.rgb = ACCENT_ORANGE
    sh_dec2.line.fill.background()
    format_shape_text(sh_dec2, "Is OTP Verified?", 9.5, True)

    # Arrow from Production -> Decision 2
    arr_prod_dec2 = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(5.5), Inches(4.97), Inches(0.2), Inches(0.21))
    arr_prod_dec2.fill.solid()
    arr_prod_dec2.fill.fore_color.rgb = TEXT_MUTED
    arr_prod_dec2.line.fill.background()

    # Left branch: Reject -> Scrap Yard -> Cancel / Lock Profile (Oval - Emerald)
    sh_l_arr2 = slide.shapes.add_shape(MSO_SHAPE.LEFT_ARROW, Inches(3.2), Inches(5.5), Inches(0.9), Inches(0.2))
    sh_l_arr2.fill.solid()
    sh_l_arr2.fill.fore_color.rgb = ACCENT_ORANGE
    sh_l_arr2.line.fill.background()
    
    tb_rej2 = slide.shapes.add_textbox(Inches(3.3), Inches(5.2), Inches(0.8), Inches(0.3))
    tb_rej2.text_frame.paragraphs[0].text = "Reject"
    tb_rej2.text_frame.paragraphs[0].font.size = Pt(8.5)
    tb_rej2.text_frame.paragraphs[0].font.bold = True
    tb_rej2.text_frame.paragraphs[0].font.color.rgb = ACCENT_ORANGE

    sh_rej_oval = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.8), Inches(5.37), Inches(2.2), Inches(0.45))
    sh_rej_oval.fill.solid()
    sh_rej_oval.fill.fore_color.rgb = ACCENT_EMERALD
    sh_rej_oval.line.fill.background()
    format_shape_text(sh_rej_oval, "Cancel / Lock Profile", 9.5, True)
    
    sh_rej_doc = slide.shapes.add_shape(MSO_SHAPE.FOLDED_CORNER, Inches(0.8), Inches(6.05), Inches(1.1), Inches(0.55))
    sh_rej_doc.fill.solid()
    sh_rej_doc.fill.fore_color.rgb = CARD_BG_COLOR
    sh_rej_doc.line.color.rgb = TEXT_MUTED
    format_shape_text(sh_rej_doc, "Intake Reset Alert", 8, False, TEXT_MUTED)

    # Rework Loop: Rework -> Loops back to Production
    arr_rework_horiz = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(3.8), Inches(4.7), Inches(0.7), Inches(0.02))
    arr_rework_horiz.fill.solid()
    arr_rework_horiz.fill.fore_color.rgb = TEXT_MUTED
    arr_rework_horiz.line.fill.background()
    
    arr_rework_vert = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(3.8), Inches(4.7), Inches(0.02), Inches(0.9))
    arr_rework_vert.fill.solid()
    arr_rework_vert.fill.fore_color.rgb = TEXT_MUTED
    arr_rework_vert.line.fill.background()
    
    arr_rework_dec2 = slide.shapes.add_shape(MSO_SHAPE.LEFT_ARROW, Inches(3.82), Inches(5.58), Inches(0.2), Inches(0.02))
    arr_rework_dec2.fill.solid()
    arr_rework_dec2.fill.fore_color.rgb = TEXT_MUTED
    arr_rework_dec2.line.fill.background()
    
    tb_rework = slide.shapes.add_textbox(Inches(3.0), Inches(4.45), Inches(0.8), Inches(0.3))
    tb_rework.text_frame.paragraphs[0].text = "Rework"
    tb_rework.text_frame.paragraphs[0].font.size = Pt(8.5)
    tb_rework.text_frame.paragraphs[0].font.bold = True
    tb_rework.text_frame.paragraphs[0].font.color.rgb = TEXT_MUTED

    # Right branch: OK -> Packaging & Labelling -> Initialize Case Workspace
    sh_r_arr2 = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(7.1), Inches(5.5), Inches(0.9), Inches(0.2))
    sh_r_arr2.fill.solid()
    sh_r_arr2.fill.fore_color.rgb = ACCENT_EMERALD
    sh_r_arr2.line.fill.background()
    
    tb_ok2 = slide.shapes.add_textbox(Inches(7.2), Inches(5.2), Inches(0.4), Inches(0.3))
    tb_ok2.text_frame.paragraphs[0].text = "OK"
    tb_ok2.text_frame.paragraphs[0].font.size = Pt(8.5)
    tb_ok2.text_frame.paragraphs[0].font.bold = True
    tb_ok2.text_frame.paragraphs[0].font.color.rgb = ACCENT_EMERALD

    sh_workspace = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(8.2), Inches(5.37), Inches(2.2), Inches(0.45))
    sh_workspace.fill.solid()
    sh_workspace.fill.fore_color.rgb = ACCENT_AMBER
    sh_workspace.line.fill.background()
    format_shape_text(sh_workspace, "Initialize Case Workspace", 9, True, BG_COLOR)

    # Document under Workspace
    sh_wk_doc = slide.shapes.add_shape(MSO_SHAPE.FOLDED_CORNER, Inches(8.2), Inches(6.05), Inches(1.1), Inches(0.55))
    sh_wk_doc.fill.solid()
    sh_wk_doc.fill.fore_color.rgb = CARD_BG_COLOR
    sh_wk_doc.line.color.rgb = TEXT_MUTED
    format_shape_text(sh_wk_doc, "Signed retainer agreement", 8, False, TEXT_MUTED)

    # --- THIRD STAGE & DECISION ---
    # 8. Pre-Dispatch Inspection -> AI Document Scan & Audit (Blue Box)
    sh_audit = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.8), Inches(5.37), Inches(2.1), Inches(0.45))
    sh_audit.fill.solid()
    sh_audit.fill.fore_color.rgb = ACCENT_INDIGO
    sh_audit.line.fill.background()
    format_shape_text(sh_audit, "AI Contract Scan & Audit", 9.5, True)

    # Arrow from Workspace -> Audit
    arr_wk_audit = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(10.45), Inches(5.5), Inches(0.3), Inches(0.2))
    arr_wk_audit.fill.solid()
    arr_wk_audit.fill.fore_color.rgb = TEXT_MUTED
    arr_wk_audit.line.fill.background()

    # Document under Audit
    sh_audit_doc = slide.shapes.add_shape(MSO_SHAPE.FOLDED_CORNER, Inches(10.8), Inches(6.05), Inches(1.0), Inches(0.55))
    sh_audit_doc.fill.solid()
    sh_audit_doc.fill.fore_color.rgb = CARD_BG_COLOR
    sh_audit_doc.line.color.rgb = TEXT_MUTED
    format_shape_text(sh_audit_doc, "Scan Verdict Log", 8, False, TEXT_MUTED, "Consolas")

    # 9. OK or Not? -> Predatory Clauses Found? (Orange Diamond)
    sh_dec3 = slide.shapes.add_shape(MSO_SHAPE.DIAMOND, Inches(10.6), Inches(4.2), Inches(2.5), Inches(0.8))
    sh_dec3.fill.solid()
    sh_dec3.fill.fore_color.rgb = ACCENT_ORANGE
    sh_dec3.line.fill.background()
    format_shape_text(sh_dec3, "Predatory Clauses\nFound?", 8.5, True)

    # Arrow from Audit -> Decision 3 (upwards)
    arr_audit_dec3 = slide.shapes.add_shape(MSO_SHAPE.UP_ARROW, Inches(11.8), Inches(5.05), Inches(0.2), Inches(0.3))
    arr_audit_dec3.fill.solid()
    arr_audit_dec3.fill.fore_color.rgb = TEXT_MUTED
    arr_audit_dec3.line.fill.background()

    # Left branch if Yes: Not OK (for disposal decision) -> Loops back to Onboarding/Consultation
    arr_dec3_left_vert = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(10.3), Inches(4.58), Inches(0.02), Inches(0.6))
    arr_dec3_left_vert.fill.solid()
    arr_dec3_left_vert.fill.fore_color.rgb = ACCENT_ORANGE
    arr_dec3_left_vert.line.fill.background()
    
    arr_dec3_left_horiz = slide.shapes.add_shape(MSO_SHAPE.LEFT_ARROW, Inches(6.8), Inches(5.1), Inches(3.52), Inches(0.02))
    arr_dec3_left_horiz.fill.solid()
    arr_dec3_left_horiz.fill.fore_color.rgb = ACCENT_ORANGE
    arr_dec3_left_horiz.line.fill.background()
    
    tb_fail_dec3 = slide.shapes.add_textbox(Inches(7.2), Inches(4.8), Inches(2.2), Inches(0.3))
    tb_fail_dec3.text_frame.paragraphs[0].text = "Yes (Request contract renegotiation)"
    tb_fail_dec3.text_frame.paragraphs[0].font.size = Pt(8.5)
    tb_fail_dec3.text_frame.paragraphs[0].font.bold = True
    tb_fail_dec3.text_frame.paragraphs[0].font.color.rgb = ACCENT_ORANGE

    # Up branch if No: OK -> Despatch -> Active Case Resolution / Dispatch (Oval - Emerald)
    sh_dispatch = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(10.8), Inches(3.2), Inches(2.4), Inches(0.45))
    sh_dispatch.fill.solid()
    sh_dispatch.fill.fore_color.rgb = ACCENT_EMERALD
    sh_dispatch.line.fill.background()
    format_shape_text(sh_dispatch, "Active Case Resolution", 9.5, True)

    # Arrow from Decision 3 -> Dispatch
    arr_dec3_disp = slide.shapes.add_shape(MSO_SHAPE.UP_ARROW, Inches(11.8), Inches(3.7), Inches(0.2), Inches(0.45))
    arr_dec3_disp.fill.solid()
    arr_dec3_disp.fill.fore_color.rgb = ACCENT_EMERALD
    arr_dec3_disp.line.fill.background()
    
    tb_ok3 = slide.shapes.add_textbox(Inches(12.0), Inches(3.8), Inches(0.4), Inches(0.3))
    tb_ok3.text_frame.paragraphs[0].text = "No"
    tb_ok3.text_frame.paragraphs[0].font.size = Pt(8.5)
    tb_ok3.text_frame.paragraphs[0].font.bold = True
    tb_ok3.text_frame.paragraphs[0].font.color.rgb = ACCENT_EMERALD

    # ====================================================
    # SLIDE 6: Wireframes/Mock diagrams
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg_and_header(slide, "Wireframes & Mock Layouts", "INTERFACE DESIGN")
    
    wx = [Inches(0.8), Inches(6.8), Inches(0.8), Inches(6.8)]
    wy = [Inches(1.8), Inches(1.8), Inches(4.3), Inches(4.3)]
    
    wireframes = [
        ("01 / MULTILINGUAL INTAKE PANEL", "Textarea coupled with recording indicator pulse and voice language toggle dropdown."),
        ("02 / ADVOCATE FOLDER DIRECTORIES", "Terracotta dashed cards highlighting lawyer statistics, license verification, and tracks."),
        ("03 / CASE WORKSPACE SPLIT-VIEW", "Collaborative secure chat window on the left and interactive litigation roadmap checklist on the right."),
        ("04 / DOCUMENT CLAUSE AUDITOR", "Contract upload scanner displaying color-coded warn logs alongside identified predatory clauses.")
    ]
    
    for i, (title, desc) in enumerate(wireframes):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, wx[i], wy[i], Inches(5.7), Inches(2.2))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG_COLOR
        card.line.color.rgb = RGBColor(51, 65, 85)
        
        tf = card.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = "Consolas"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = ACCENT_INDIGO
        p.space_after = Pt(8)
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_PRIMARY
        p2.line_spacing = 1.25

    # ====================================================
    # SLIDE 7: Technical Architecture Diagram (Realistic Connected Nodes)
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg_and_header(slide, "System Architecture Nodes", "TECHNICAL LAYERING")
    
    nx = [Inches(0.8), Inches(4.8), Inches(9.2), Inches(9.2)]
    ny = [Inches(2.8), Inches(2.8), Inches(1.8), Inches(4.8)]
    nw = [Inches(3.0), Inches(3.0), Inches(3.3), Inches(3.3)]
    nh = [Inches(2.8), Inches(2.8), Inches(1.8), Inches(1.8)]
    
    node_details = [
        ("FRONTEND CLIENT (SPA)", "HTML5 / CSS3\nES6 JavaScript\nwebkitSpeechRecognition\nLucide UI Icons\nGoogle Fonts API", ACCENT_CYAN),
        ("REST BACKEND ENGINE", "Node.js Platform\nExpress.js Framework\nBody-Parser Gateway\nCORS Middleware", ACCENT_INDIGO),
        ("COGNITIVE AI SERVICES", "Anthropic Claude API\n- Intake NLP entity extraction\n- Clause warning analysis", ACCENT_ORANGE),
        ("PERSISTENCE DATA LAYER", "LibSQL Database Client\nSQLite File Database\nTurso SQL Cloud DB", TEXT_MUTED)
    ]
    
    for i, (title, desc, color) in enumerate(node_details):
        node = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, nx[i], ny[i], nw[i], nh[i])
        node.fill.solid()
        node.fill.fore_color.rgb = CARD_BG_COLOR
        node.line.color.rgb = color
        node.line.width = Pt(1.5)
        
        tf = node.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = "Consolas"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(8)
        
        for line in desc.split('\n'):
            p2 = tf.add_paragraph()
            p2.text = line
            p2.font.name = "Segoe UI"
            p2.font.size = Pt(10)
            p2.font.color.rgb = TEXT_PRIMARY
            p2.space_after = Pt(2)

    arrow1 = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(3.9), Inches(4.05), Inches(0.8), Inches(0.3))
    arrow1.fill.solid()
    arrow1.fill.fore_color.rgb = ACCENT_INDIGO
    arrow1.line.fill.background()
    
    arrow2 = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(7.9), Inches(2.6), Inches(1.2), Inches(0.3))
    arrow2.rotation = 330.0
    arrow2.fill.solid()
    arrow2.fill.fore_color.rgb = ACCENT_ORANGE
    arrow2.line.fill.background()
    
    arrow3 = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(7.9), Inches(5.6), Inches(1.2), Inches(0.3))
    arrow3.rotation = 30.0
    arrow3.fill.solid()
    arrow3.fill.fore_color.rgb = TEXT_MUTED
    arrow3.line.fill.background()

    # ====================================================
    # SLIDE 8: Technologies Used
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg_and_header(slide, "Technologies Used", "DEVELOPMENT STACK")
    
    tx = [Inches(0.8), Inches(3.7), Inches(6.6), Inches(9.5)]
    techs = [
        ("FRONTEND", "HTML5 Layouts\nVanilla CSS3\n- Slate dark theme\n- Glassmorphic panels\nES6 JavaScript\nLucide Icons Pack\nGoogle Fonts\n- Fraunces Serif\n- IBM Plex Mono"),
        ("BACKEND", "Node.js Runtime\nExpress.js Framework\nCORS Config\nDotenv (Env Vars)\nExpress JSON Parsers\n(Base64 file buffer limit up to 50MB)"),
        ("DATABASE", "LibSQL Database Client\nSQLite (local development vakilsetu.db)\nTurso (production cloud database deployment)\nAutomatic Seeding & Migration scripts"),
        ("INTEGRATION APIs", "Anthropic Claude API\n- Case diagnostics\n- Playbook steps\n- Clause audits\nWeb Speech API\n- Speech-to-text voice input\nDigiLocker Mock Gateway\n- Lawyer credential verify")
    ]
    
    for i, (title, desc) in enumerate(techs):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, tx[i], Inches(1.8), Inches(2.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG_COLOR
        card.line.color.rgb = RGBColor(51, 65, 85)
        
        tf = card.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = "Consolas"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = ACCENT_INDIGO
        p.space_after = Pt(14)
        
        for line in desc.split('\n'):
            p_line = tf.add_paragraph()
            p_line.text = line
            p_line.font.name = "Segoe UI"
            p_line.font.size = Pt(11)
            p_line.font.color.rgb = TEXT_PRIMARY if not line.strip().startswith("-") else TEXT_MUTED
            p_line.space_after = Pt(4)

    # ====================================================
    # SLIDE 9: Cost Analysis
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg_and_header(slide, "Cost Analysis", "PROJECT FEASIBILITY")
    
    cost_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.8))
    cost_shape.fill.solid()
    cost_shape.fill.fore_color.rgb = CARD_BG_COLOR
    cost_shape.line.color.rgb = ACCENT_CYAN
    cost_shape.line.width = Pt(1.5)
    
    tf = cost_shape.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "MVP DEVELOPMENT & DEPLOYMENT COST MODEL"
    p.font.name = "Consolas"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(18)
    
    cost_items = [
        ("Deployment & Web Hosting (Vercel Serverless):", "Free Hobby Tier (0$ / month) - scalable to 20$ / month Pro team plan for multi-domain routing."),
        ("Cloud Database (Turso SQL):", "Free Starter Tier (0$ / month) - includes 500MB storage and 1 billion reads, perfectly sufficient for MVP testing."),
        ("AI API Engine (Anthropic Claude 3.5 Sonnet / Haiku):", "Pay-as-you-go credit token model: ~$0.005 per intake NLP extraction request and ~$0.015 per PDF contract clause scan. Estimated active hackathon demo cost: ~$5 - $10 total."),
        ("Development Licensing & Tooling:", "Utilizes open-source libraries (LibSQL, Express, Lucide, Web Speech API) incurring zero licensing costs.")
    ]
    
    for title, desc in cost_items:
        p = tf.add_paragraph()
        run1 = p.add_run()
        run1.text = f"{title} "
        run1.font.name = "Segoe UI"
        run1.font.size = Pt(13)
        run1.font.bold = True
        run1.font.color.rgb = ACCENT_INDIGO
        
        run2 = p.add_run()
        run2.text = desc
        run2.font.name = "Segoe UI"
        run2.font.size = Pt(13)
        run2.font.color.rgb = TEXT_PRIMARY
        p.space_after = Pt(14)
        p.line_spacing = 1.3
        
    p_summary = tf.add_paragraph()
    p_summary.text = "TOTAL PROJECTED MONTHLY COST FOR MVP TESTING: $0.00 (Relying on Cloud Free Tiers)"
    p_summary.font.name = "Segoe UI"
    p_summary.font.size = Pt(14)
    p_summary.font.bold = True
    p_summary.font.color.rgb = ACCENT_ORANGE
    p_summary.space_before = Pt(14)

    # ====================================================
    # SLIDE 10: Thank You (Full Page Cover style)
    # ====================================================
    slide = prs.slides.add_slide(blank_layout)
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BG_COLOR
    
    stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.12), Inches(7.5))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = ACCENT_CYAN
    stripe.line.fill.background()
    
    thank_box = slide.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.3), Inches(3.5))
    tf = thank_box.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = "THANK YOU"
    p.font.name = "Segoe UI"
    p.font.size = Pt(64)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(12)
    
    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "VakilSetu: Legal Help Made Accessible"
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(22)
    p2.font.color.rgb = TEXT_PRIMARY
    p2.space_after = Pt(14)
    
    p3 = tf.add_paragraph()
    p3.alignment = PP_ALIGN.CENTER
    p3.text = "GitHub Repository: https://github.com/Goldengrab/YCCE"
    p3.font.name = "Consolas"
    p3.font.size = Pt(13)
    p3.font.color.rgb = ACCENT_INDIGO
    
    prs.save("VakilSetu_Pitch_Deck_v2.pptx")
    print("Presentation saved successfully as VakilSetu_Pitch_Deck_v2.pptx")

if __name__ == "__main__":
    create_deck()
