import type { BlogPost } from '@/types/blog';

// This would typically fetch from a CMS or API
// For now, we'll use mock data
export async function getAllBlogs(): Promise<BlogPost[]> {
  // In a real app, you would fetch from your CMS or API
  // Example: return await fetch('https://your-api.com/blogs').then(res => res.json())

  return MOCK_BLOGS;
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const blogs = await getAllBlogs();
  return blogs.find((blog) => blog.slug === slug) || null;
}

export async function getRelatedBlogs(
  currentSlug: string,
  tags: string,
  limit = 3
): Promise<BlogPost[]> {
  const blogs = await getAllBlogs();

  // Filter out the current blog and find blogs with matching tags
  return blogs
    .filter((blog) => blog.slug !== currentSlug)
    .filter((blog) => blog.tags.some((tag) => tags.includes(tag)))
    .slice(0, limit);
}

// Mock data - replace with actual data in production
const MOCK_BLOGS: BlogPost[] = [
  {
    title: 'Understanding Smart Contract Vulnerabilities in DeFi',
    slug: 'understanding-smart-contract-vulnerabilities',
    excerpt:
      'An in-depth analysis of common vulnerabilities in DeFi smart contracts and how to prevent them.',
    content:
      '<p>Smart contracts are self-executing contracts with the terms directly written into code. They run on blockchain networks like Ethereum and automatically execute when predetermined conditions are met.</p><h2>Common Vulnerabilities</h2><p>Despite their advantages, smart contracts can contain vulnerabilities that malicious actors may exploit. Here are some common vulnerabilities:</p><ul><li><strong>Reentrancy Attacks</strong>: When a function makes an external call to another untrusted contract before it resolves any effects.</li><li><strong>Integer Overflow and Underflow</strong>: When arithmetic operations reach the maximum or minimum size of the type.</li><li><strong>Front-Running</strong>: When someone sees a transaction in the mempool and submits their own with higher gas fees to be processed first.</li></ul><h2>Prevention Measures</h2><p>To prevent these vulnerabilities, developers should:</p><ul><li>Follow the checks-effects-interactions pattern</li><li>Use SafeMath libraries for arithmetic operations</li><li>Implement rate limiting and circuit breakers</li><li>Conduct thorough testing and formal verification</li><li>Undergo professional security audits</li></ul>',
    coverImage: '/placeholder.svg?height=600&width=800',
    date: '2023-10-15',
    author: 'Jane Smith',
    readingTime: 8,
    tags: ['Smart Contracts', 'DeFi', 'Security', 'Blockchain'],
  },
  {
    title: 'The Rise of AI in Cybersecurity: Opportunities and Challenges',
    slug: 'ai-in-cybersecurity',
    excerpt:
      'How artificial intelligence is transforming the cybersecurity landscape and what it means for businesses.',
    content:
      '<p>Artificial Intelligence (AI) is revolutionizing cybersecurity by enabling faster threat detection and response. This article explores the opportunities and challenges of AI in cybersecurity.</p><h2>Opportunities</h2><p>AI offers several advantages in cybersecurity:</p><ul><li><strong>Automated Threat Detection</strong>: AI can analyze patterns and identify anomalies that might indicate a security breach.</li><li><strong>Rapid Response</strong>: AI systems can respond to threats in real-time, minimizing damage.</li><li><strong>Predictive Analysis</strong>: AI can predict potential vulnerabilities before they are exploited.</li></ul><h2>Challenges</h2><p>Despite its benefits, AI in cybersecurity faces several challenges:</p><ul><li><strong>False Positives</strong>: AI systems may generate false alarms, leading to alert fatigue.</li><li><strong>Adversarial Attacks</strong>: Hackers can manipulate AI systems using specially crafted inputs.</li><li><strong>Data Privacy</strong>: AI requires vast amounts of data, raising privacy concerns.</li></ul><h2>The Future</h2><p>As AI technology evolves, we can expect more sophisticated cybersecurity solutions that combine human expertise with machine learning capabilities.</p>',
    coverImage: '/placeholder.svg?height=600&width=800',
    date: '2023-11-02',
    author: 'John Doe',
    readingTime: 6,
    tags: ['AI', 'Cybersecurity', 'Machine Learning', 'Threat Detection'],
  },
  {
    title: 'NFT Security: Protecting Your Digital Assets',
    slug: 'nft-security-protecting-digital-assets',
    excerpt:
      'Essential security practices for NFT creators, collectors, and platforms to safeguard valuable digital assets.',
    content:
      "<p>Non-Fungible Tokens (NFTs) have gained immense popularity, but with this rise comes increased security risks. This article outlines essential security practices for NFT stakeholders.</p><h2>For NFT Creators</h2><p>If you're creating and minting NFTs, consider these security measures:</p><ul><li><strong>Secure Minting Platforms</strong>: Use reputable platforms with proven security records.</li><li><strong>Metadata Security</strong>: Ensure your NFT metadata is stored securely, preferably on decentralized storage.</li><li><strong>Smart Contract Audits</strong>: Have your smart contracts audited by security professionals.</li></ul><h2>For NFT Collectors</h2><p>Collectors should take these precautions:</p><ul><li><strong>Hardware Wallets</strong>: Store valuable NFTs in hardware wallets disconnected from the internet.</li><li><strong>Phishing Awareness</strong>: Be vigilant about phishing attempts targeting your NFT collection.</li><li><strong>Verification</strong>: Always verify the authenticity of NFT projects before purchasing.</li></ul><h2>For NFT Platforms</h2><p>Platforms handling NFTs should implement:</p><ul><li><strong>Multi-factor Authentication</strong>: Require MFA for all user accounts.</li><li><strong>Regular Security Audits</strong>: Conduct frequent security assessments.</li><li><strong>Insurance Coverage</strong>: Consider insurance for high-value NFT holdings.</li></ul>",
    coverImage: '/placeholder.svg?height=600&width=800',
    date: '2023-09-18',
    author: 'Alex Johnson',
    readingTime: 7,
    tags: ['NFTs', 'Digital Assets', 'Security', 'Blockchain'],
  },
  {
    title: 'Zero Trust Architecture: Beyond the Perimeter',
    slug: 'zero-trust-architecture',
    excerpt:
      'Why traditional perimeter-based security is no longer sufficient and how Zero Trust models are changing enterprise security.',
    content:
      "<p>Zero Trust is a security concept centered on the belief that organizations should not automatically trust anything inside or outside their perimeters.</p><h2>The Limitations of Perimeter Security</h2><p>Traditional security models operate on the assumption that everything inside an organization's network should be trusted. This approach has several limitations:</p><ul><li><strong>Insider Threats</strong>: Perimeter security doesn't protect against malicious insiders.</li><li><strong>VPN Vulnerabilities</strong>: Remote work has exposed weaknesses in VPN-based security.</li><li><strong>Lateral Movement</strong>: Once inside, attackers can move laterally across the network.</li></ul><h2>Zero Trust Principles</h2><p>Zero Trust architecture is based on these key principles:</p><ul><li><strong>Verify Explicitly</strong>: Always authenticate and authorize based on all available data points.</li><li><strong>Use Least Privilege Access</strong>: Limit user access with Just-In-Time and Just-Enough-Access.</li><li><strong>Assume Breach</strong>: Minimize blast radius and segment access. Verify end-to-end encryption and use analytics to improve defenses.</li></ul><h2>Implementing Zero Trust</h2><p>Organizations can implement Zero Trust by:</p><ul><li>Identifying sensitive data and assets</li><li>Mapping the flows of sensitive data</li><li>Architecting Zero Trust micro-perimeters</li><li>Creating policies based on the principle of least privilege</li><li>Continuously monitoring and validating security controls</li></ul><p>By adopting Zero Trust, organizations can significantly improve their security posture in today's complex threat landscape.</p>",
    coverImage: '/placeholder.svg?height=600&width=800',
    date: '2023-12-05',
    author: 'Sarah Chen',
    readingTime: 9,
    tags: [
      'Zero Trust',
      'Cybersecurity',
      'Enterprise Security',
      'Network Security',
    ],
  },
  {
    title: 'Blockchain Audit Best Practices for 2023',
    slug: 'blockchain-audit-best-practices-2023',
    excerpt:
      'A comprehensive guide to auditing blockchain applications and smart contracts in 2023.',
    content:
      "<p>Blockchain technology continues to evolve, and so do the methods for auditing blockchain applications. This article covers the latest best practices for blockchain audits in 2023.</p><h2>Pre-Audit Preparation</h2><p>Before beginning a blockchain audit, teams should:</p><ul><li><strong>Define Scope</strong>: Clearly outline what components will be audited.</li><li><strong>Gather Documentation</strong>: Collect all relevant technical documentation and specifications.</li><li><strong>Understand Business Logic</strong>: Comprehend the intended functionality of the blockchain application.</li></ul><h2>Technical Audit Process</h2><p>The technical audit should include:</p><ul><li><strong>Static Analysis</strong>: Use automated tools to identify common vulnerabilities.</li><li><strong>Dynamic Analysis</strong>: Test the application in a simulated environment.</li><li><strong>Formal Verification</strong>: Mathematically prove the correctness of critical components.</li><li><strong>Manual Code Review</strong>: Have experienced auditors review the code line by line.</li></ul><h2>Post-Audit Activities</h2><p>After the audit, teams should:</p><ul><li><strong>Remediation</strong>: Address all identified vulnerabilities.</li><li><strong>Verification</strong>: Verify that fixes don't introduce new issues.</li><li><strong>Continuous Monitoring</strong>: Implement ongoing security monitoring.</li></ul><p>By following these best practices, organizations can ensure the security and reliability of their blockchain applications.</p>",
    coverImage: '/placeholder.svg?height=600&width=800',
    date: '2023-08-20',
    author: 'Michael Wong',
    readingTime: 10,
    tags: ['Blockchain', 'Audit', 'Smart Contracts', 'Security'],
  },
  {
    title: 'API Security: Protecting Your Digital Endpoints',
    slug: 'api-security-protecting-digital-endpoints',
    excerpt:
      'Essential strategies to secure APIs against common vulnerabilities and emerging threats.',
    content:
      '<p>APIs are the backbone of modern applications, but they also represent significant security risks if not properly protected.</p><h2>Common API Vulnerabilities</h2><p>APIs are susceptible to various security issues:</p><ul><li><strong>Broken Authentication</strong>: Weak or missing authentication mechanisms.</li><li><strong>Excessive Data Exposure</strong>: Returning more data than necessary.</li><li><strong>Broken Object Level Authorization</strong>: Failing to check authorization for specific objects.</li><li><strong>Rate Limiting</strong>: Not implementing proper rate limiting, leading to DoS vulnerabilities.</li></ul><h2>Security Best Practices</h2><p>To secure APIs, organizations should:</p><ul><li><strong>Implement OAuth 2.0</strong>: Use industry-standard authentication protocols.</li><li><strong>Use API Gateways</strong>: Centralize authentication, rate limiting, and monitoring.</li><li><strong>Validate All Inputs</strong>: Implement strict input validation to prevent injection attacks.</li><li><strong>Encrypt Data in Transit</strong>: Always use HTTPS/TLS for API communications.</li></ul><h2>API Security Testing</h2><p>Regular security testing should include:</p><ul><li>Automated scanning with specialized API security tools</li><li>Manual penetration testing by security experts</li><li>Fuzz testing to identify unexpected behaviors</li></ul><p>By implementing these security measures, organizations can protect their APIs from exploitation and ensure the integrity of their digital services.</p>',
    coverImage: '/placeholder.svg?height=600&width=800',
    date: '2023-10-30',
    author: 'Lisa Park',
    readingTime: 8,
    tags: ['API Security', 'Web Security', 'Authentication', 'Cybersecurity'],
  },
];
