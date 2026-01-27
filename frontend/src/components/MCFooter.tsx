export default function MCFooter() {
  const links = [
    { label: 'Defense Builders', href: 'https://www.mergecombinator.com/builders' },
    { label: 'Combine', href: 'https://www.mergecombinator.com/combine' },
    { label: 'Knowledge', href: 'https://www.mergecombinator.com/knowledge' },
    { label: 'Access', href: 'https://www.mergecombinator.com/access' },
  ]

  return (
    <footer className="mc-footer">
      <a
        href="https://www.mergecombinator.com"
        className="mc-footer__brand"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="mc-footer__logo-mark">M</span>
        <span className="mc-footer__logo-text">Merge Combinator</span>
      </a>
      <p className="mc-footer__tagline">
        The builder-led venture studio for national security.
      </p>
      <nav className="mc-footer__links">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="mc-footer__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label}
          </a>
        ))}
      </nav>
      <p className="mc-footer__copyright">
        &copy; 2026 Merge Combinator. All rights reserved.
      </p>
    </footer>
  )
}
