# DreamLog — UI Component Specification (DE-01)

**Design language:** Calm · Dark-mode-first · Minimal · Indigo/Purple accent palette
**Framework:** Next.js 14 App Router + Tailwind CSS + shadcn/ui

---

## 1. Landing Page (Pre-Auth)

### Component Tree

```
<LandingLayout>
  <NavBar>
    <Logo />                        # DreamLog wordmark + moon icon
    <NavLinks>                      # "Features" "Pricing" "Blog"
    <AuthButtons>                   # "Sign in" (ghost) + "Get started" (primary)
  </NavBar>

  <HeroSection>
    <HeroBadge>                     # "Privacy-first · AI-powered"
    <HeroHeadline>                  # H1: "Understand your dreams. Own your data."
    <HeroSubtext>                   # 2-line description
    <HeroCTA>                       # Primary button: "Start free — no credit card"
    <HeroVisual>                    # Animated mock of the dream editor (CSS-only)

  <FeaturesSection>
    <SectionHeading>
    <FeatureGrid>                   # 3-column on desktop, 1-column mobile
      <FeatureCard> × 6            # Icon + title + 1-line description

  <SocialProofSection>
    <QuoteCarousel>                 # 3 user quotes, auto-scroll
    <StatsRow>                      # "2,400+ dreams logged · 4.9★ avg rating"

  <PricingSection>
    <SectionHeading>
    <BillingToggle>                 # Monthly / Annual switch
    <PricingGrid>                   # 3 cards: Free / Pro / Lifetime
      <PricingCard>
        <PlanName>
        <PlanPrice>
        <FeatureList>
        <PlanCTA>

  <FAQSection>
    <Accordion> × 8

  <FooterCTA>
    <CTAHeadline>
    <CTAButton>

  <Footer>
    <FooterLinks>                   # Privacy · Terms · Blog · GitHub
    <Copyright>
```

### Interaction States
- **NavBar:** Transparent on scroll position 0, `backdrop-blur` + border on scroll
- **HeroCTA:** Hover → subtle lift shadow; focus → 2px ring indigo
- **PricingCard (Pro):** Default highlighted with `ring-2 ring-indigo-500`; billing toggle animates price with CSS transition
- **FAQ Accordion:** Smooth height animation via Radix UI

### Accessibility
- All images have descriptive `alt` text
- NavBar keyboard-navigable; hamburger menu traps focus on mobile
- Pricing table uses `<table>` semantics on desktop, `<dl>` on mobile
- Color contrast: all text ≥ 4.5:1 on background

### Mobile vs Desktop
- NavBar collapses to hamburger menu at `md` breakpoint
- FeatureGrid: 3-col → 1-col
- PricingGrid: side-by-side → stacked (Pro card floats to top)
- HeroVisual: hidden on mobile `xs`

---

## 2. Onboarding Flow (3 Screens)

### Screen 2a · Welcome

```
<OnboardingLayout>                  # Full-screen, centered, no nav
  <ProgressDots step={1} of={3} />
  <WelcomeIllustration />           # Moon + stars SVG, subtle float animation
  <Heading>Welcome to DreamLog</Heading>
  <Subtext>Your private space for dream journaling.</Subtext>
  <ContinueButton>Get started →</ContinueButton>
```

### Screen 2b · First Entry

```
<OnboardingLayout>
  <ProgressDots step={2} of={3} />
  <Heading>Log your first dream</Heading>
  <Subtext>Don't worry about perfect words. Just write.</Subtext>
  <MiniEditor>                      # Simplified Tiptap, no toolbar
    <PlaceholderText>               # "I was standing in a field..."
  <SkipLink>                        # "Skip for now" — below CTA
  <ContinueButton>Save my dream →</ContinueButton>
```

### Screen 2c · Notification Opt-In

```
<OnboardingLayout>
  <ProgressDots step={3} of={3} />
  <BellIllustration />
  <Heading>Get gentle morning reminders?</Heading>
  <Subtext>Dreams fade fast. A reminder at 7am can help.</Subtext>
  <TimePicker>                      # Default 07:00
  <EnableButton>Yes, remind me</EnableButton>
  <SkipLink>No thanks</SkipLink>
```

### Interaction States
- ProgressDots: completed dots fill indigo; active pulses softly
- MiniEditor: auto-focuses on mount; character count shows at 20+ chars
- TimePicker: native `<input type="time">` styled to match design system

### Accessibility
- Each screen is a `<main>` landmark; heading levels are correct (h1 per screen)
- SkipLink is visually de-emphasised but fully keyboard-accessible
- Progress dots have aria-label "Step N of 3"

---

## 3. Dashboard / Feed

```
<DashboardLayout>
  <Sidebar>                         # Desktop only (hidden md: and below)
    <Logo />
    <NavItem icon="home">Feed</NavItem>
    <NavItem icon="search">Search</NavItem>
    <NavItem icon="book">Notebooks</NavItem>
    <NavItem icon="chart">Insights (Pro)</NavItem>
    <Spacer />
    <UserAvatar />
    <NavItem icon="settings">Settings</NavItem>

  <MainContent>
    <TopBar>                        # Mobile only
      <HamburgerMenu />
      <Logo />
      <NewEntryButton />            # "+" icon

    <PageHeader>
      <Heading>Your Dreams</Heading>
      <NewEntryButton>+ New dream</NewEntryButton>   # Desktop

    <FilterRow>
      <SearchInput placeholder="Search dreams…" />
      <MoodFilter>                  # Dropdown: All moods
      <DateFilter>                  # Dropdown: This month

    <DreamFeed>
      <DreamCard> × N
        <DreamDate />               # "Mon 3 March 2026"
        <DreamTitle />              # Truncated at 60 chars
        <DreamExcerpt />            # 2 lines of body text
        <DreamMeta>
          <MoodBadge />             # Colour-coded 1–5
          <TagList> × max 3 />      # + overflow count
          <LucidBadge />            # Only if lucid=true

      <Pagination />                # Or infinite scroll trigger
```

### Interaction States
- **DreamCard:** Hover → `bg-surface-hover`; active → slight scale-down
- **Empty state:** Illustration + "Log your first dream" CTA
- **Loading:** Skeleton cards (3 rows) with shimmer animation
- **Error:** Inline error banner with retry button

### Accessibility
- DreamCard is a `<article>` with `aria-labelledby` pointing to its title
- Mood badges have text labels (not colour alone): `aria-label="Mood: 4 out of 5"`
- Keyboard shortcut: `N` for new entry (announced in tooltip)

---

## 4. Dream Editor

```
<EditorLayout>                      # Full-screen, distraction-free
  <EditorTopBar>
    <BackButton />
    <AutoSaveIndicator />            # "Saved" / "Saving…" / "Unsaved changes"
    <EditorActions>
      <TagButton />
      <MoodPicker />
      <LucidToggle />
      <MoreMenu>                    # Date picker, delete, export

  <EditorBody>
    <DreamDateHeader>               # Editable date
    <TitleInput>                    # Large, fontSerif, placeholder "Untitled dream"
    <TiptapEditor>                  # Full rich text
      <EditorToolbar>               # Bold · Italic · H2 · H3 · Bullet · Quote · Divider
      <EditorContent>

  <EditorSidebar>                   # Right panel, desktop only, collapsible
    <MoodSection>
      <MoodSlider 1-5 />
    <TagSection>
      <TagInput />                  # Autocomplete from existing tags
      <TagList />
    <NotebookSection>
      <NotebookSelector />
```

### Interaction States
- **AutoSave:** Debounced 2s after last keypress; shows "Saving…" shimmer → "Saved ✓"
- **TitleInput:** Grows with content (no border, large serif font)
- **MoodSlider:** Colour transitions: 1=muted-blue → 3=indigo → 5=violet
- **Empty editor:** Helpful placeholder text fades out on first keystroke

### Accessibility
- Editor keyboard shortcuts documented in `?` overlay (`Cmd+B` bold, etc.)
- All toolbar buttons have `aria-label` and tooltip
- Full focus management: Tab navigates through toolbar then enters editor

---

## 5. Search Results Page

```
<SearchLayout>
  <SearchHeader>
    <BackButton />
    <SearchInput autofocus value={query} />  # Cmd+K shortcut
    <ClearButton />                          # Only when query non-empty

  <ResultsMeta>                    # "12 results for 'red house'"

  <ResultsList>
    <SearchResultCard> × N
      <ResultDate />
      <ResultTitle />              # Bold match highlighted
      <ResultSnippet />            # ts_headline output, matched words in <mark>
      <ResultTags />

  <EmptyState>                     # Icon + "No dreams match '…'" + suggested queries
  <Pagination />
```

### Interaction States
- **Loading:** Skeleton list while fetching (debounced 300ms before showing)
- **No results:** Friendly empty state with 3 suggested recent entries
- **Highlight:** `<mark>` tags styled with `bg-indigo-500/20 text-indigo-300`

---

## 6. Account Settings

```
<SettingsLayout>
  <SettingsSidebar>               # Left nav
    <SettingsNavItem>Profile</SettingsNavItem>
    <SettingsNavItem>Notifications</SettingsNavItem>
    <SettingsNavItem>Appearance</SettingsNavItem>
    <SettingsNavItem>Privacy & Data</SettingsNavItem>
    <SettingsNavItem>Subscription</SettingsNavItem>
    <SettingsNavItem>Danger Zone</SettingsNavItem>

  <SettingsContent>
    # Profile panel:
    <SettingsSection title="Profile">
      <AvatarUpload />
      <FormField label="Display name" />
      <FormField label="Email" type="email" />
      <SaveButton />

    # Appearance panel:
    <SettingsSection title="Appearance">
      <ThemeToggle />              # Dark / Light / System
      <FontPicker />               # UI font vs serif body toggle

    # Privacy & Data panel:
    <SettingsSection title="Privacy & Data">
      <ExportButton>Export all data (JSON)</ExportButton>
      <ExportButton>Export all data (Markdown)</ExportButton>
      <DataRetentionInfo />

    # Danger Zone panel:
    <SettingsSection title="Danger Zone">
      <DeleteAccountButton />      # Opens confirmation dialog with type-to-confirm
```

### Interaction States
- All form fields validate on blur
- Save buttons show `Saving…` spinner, then `✓ Saved` for 2s
- Delete account: two-step confirmation (modal → type "DELETE" → confirm)

### Accessibility
- Settings panels are ARIA `tabpanel` with matching `tablist` in sidebar
- Danger zone actions have `aria-describedby` pointing to consequence text
- All form fields have explicit `<label>` associations

---

*Spec version: 1.0 · 2026-03-03. Wireframes are indicative; final layout in Figma/implementation.*
