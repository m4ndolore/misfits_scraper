export default function MCHeader() {
  return (
    <header className="mc-header">
      <a
        href="https://www.mergecombinator.com"
        className="mc-header__brand"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="mc-header__logo-text">
          <span className="mc-header__logo-merge">Merge</span>
          <span className="mc-header__logo-combinator">Combinator</span>
        </span>
        <img
          src="https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/arrows/public"
          alt=""
          className="mc-header__logo-icon"
        />
      </a>
      <span className="mc-header__page-title">Opportunities</span>
    </header>
  )
}
