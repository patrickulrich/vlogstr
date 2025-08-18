# 🎬 Vlogstr - Decentralized Video Platform

**A modern, immersive video platform built on the Nostr protocol**

Vlogstr is a censorship-resistant, decentralized video sharing platform that empowers creators to own their content and connect directly with their audience through the Nostr network.

## ✨ Features

### 🎥 **Video Content**
- **Upload & Share**: Upload videos with thumbnails using Blossom servers
- **Two Video Types**: Support for both horizontal (kind 21) and vertical/short (kind 22) videos
- **Auto-thumbnails**: Automatic thumbnail generation from video content
- **Rich Metadata**: Title, description, duration, and hashtag support
- **Video Player**: Custom video player with mute controls and overlays

### 🏠 **User Experience**
- **Modern UI**: Contemporary, gradient-rich landing page with "Create. Share. Own." messaging  
- **Immersive Feed Experience**: Full-screen vertical video feeds with smooth scrolling
- **Discover Page**: Trending content discovery with infinite scroll
- **Personal Feed**: Curated content from creators you follow
- **Mobile-First**: Responsive design with mobile-optimized interactions

### 📱 **Mobile Experience**
- **Hidden Sidebar**: Clean mobile interface without desktop sidebar clutter
- **Camera Overlay Button**: Floating camera icon for easy navigation access
- **Slide-Out Menu**: Touch-friendly mobile navigation with backdrop dismissal
- **Swipe Navigation**: Scroll/swipe through video feeds
- **Mobile-Optimized**: Touch targets and responsive components

### 💬 **Social Features**
- **Modal Comments**: Comments open in elegant modal overlays (NIP-22/1111)
- **Optimistic Updates**: Instant feedback for comments and reactions
- **Real Nostr Reactions**: NIP-25 compliant like system with heart animations
- **Advanced Share Modal**: Three-way sharing system:
  - **Copy to Clipboard**: Quick link copying with visual feedback
  - **Share to Nostr**: Compose and publish kind 1 notes with helper buttons for video URL, MP4 link, and Nostr event identifier
  - **Share via DM**: Send encrypted direct messages to npubs or select from following list
- **Follow System**: Follow creators and curate your personal feed

### ⚡ **Lightning Integration**
- **Zap Support**: Send Bitcoin Lightning payments to creators
- **WebLN Integration**: One-click payments with WebLN wallets
- **NWC Support**: Nostr Wallet Connect for seamless transactions
- **QR Codes**: Lightning invoice QR codes for mobile wallet payments
- **Multiple Amounts**: Preset and custom zap amounts with emoji reactions

### 📊 **Creator Tools**
- **Analytics Dashboard**: Real-time stats from Nostr data
  - Total videos published
  - Total likes across all content
  - Comment engagement metrics
  - Follower count
- **Upload Interface**: Drag-and-drop video uploads with progress tracking
- **Content Management**: View and manage uploaded vlogs
- **Profile Editing**: Complete profile management with metadata

### 🔐 **Authentication & Identity**
- **Nostr Login**: NIP-07 compatible browser extension login
- **Multi-Account**: Switch between multiple Nostr accounts
- **Profile System**: Rich profiles with avatars, banners, and metadata
- **Identity Verification**: NIP-05 identifier support

### 🌐 **Decentralized Architecture**
- **Nostr Protocol**: Built on censorship-resistant Nostr network
- **Multiple Relays**: Configurable relay connections
- **Data Ownership**: Users own their content and identity
- **Interoperability**: Compatible with other Nostr clients
- **No Central Authority**: No single point of failure or control

### 🔍 **SEO & Discovery**
- **Rich Meta Tags**: Comprehensive Open Graph and Twitter Card support
- **Structured Data**: JSON-LD schemas for videos, profiles, and navigation
- **Dynamic SEO**: Context-aware meta tags for each page
- **Search Optimization**: Keyword-rich content for discovery
- **Social Sharing**: Optimized previews for all social platforms

### 🎨 **Design & Theming**
- **Modern UI**: shadcn/ui components with Tailwind CSS
- **Dark/Light Themes**: System and manual theme switching
- **Gradient Aesthetics**: Purple-to-pink gradients throughout
- **Responsive Design**: Mobile-first responsive layout
- **Smooth Animations**: Hover effects and transitions

## 🛠 Technology Stack

- **Frontend**: React 18.x with TypeScript
- **Styling**: TailwindCSS 3.x with shadcn/ui components
- **Build Tool**: Vite for fast development and production builds
- **Nostr**: Nostrify framework for protocol integration
- **State Management**: TanStack Query for data fetching and caching
- **Payments**: Lightning Network with WebLN and NWC
- **File Storage**: Blossom servers for decentralized file hosting
- **Routing**: React Router with NIP-19 identifier support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Nostr-compatible browser extension (like Alby, nos2x, or Flamingo)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/patrickulrich/vlogstr.git
   cd vlogstr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests and linting
npm run typecheck    # TypeScript checking
npm run lint         # ESLint checking
```

## 🔧 Configuration

### Relay Configuration
Configure your preferred Nostr relays in the app settings. Default relays include:
- wss://relay.nostr.band
- wss://relay.damus.io
- wss://nos.lol

### File Upload
Video uploads use Blossom servers for decentralized file storage. The app automatically handles:
- Video compression and optimization
- Thumbnail generation
- Metadata extraction
- NIP-94 file event creation

## 📖 Nostr Integration

### Event Types
- **Kind 0**: User profiles and metadata
- **Kind 1**: Text notes and comments
- **Kind 3**: Contact lists (following)
- **Kind 7**: Reactions (NIP-25)
- **Kind 21**: Horizontal videos
- **Kind 22**: Vertical/short videos
- **Kind 1111**: Threaded comments (NIP-22)
- **Kind 9735**: Zap receipts

### NIPs Implemented
- **NIP-01**: Basic protocol flow
- **NIP-04**: Encrypted direct messages (legacy)
- **NIP-05**: DNS-based verification
- **NIP-07**: Browser extension signing
- **NIP-19**: Bech32 identifiers (npub, note, naddr, nevent, etc.)
- **NIP-22**: Comment threads
- **NIP-25**: Reactions
- **NIP-44**: Versioned encryption for direct messages
- **NIP-57**: Lightning zaps
- **NIP-94**: File metadata

## 🎯 Core Pages

### 🏠 **Landing Page**
- Hero section with "Create. Share. Own." messaging
- Feature showcase with animated cards
- Call-to-action for creators and viewers
- Modern gradient design

### 🔍 **Discover**
- Full-screen video feed
- Trending content from across the network
- Infinite scroll with smooth transitions
- Like, comment, share, and zap interactions

### 📺 **Personal Feed**
- Curated content from followed creators
- Chronological timeline
- Empty state for new users

### 🎬 **Video Pages**
- Single-column layout focused on content
- Creator information and interactions
- Threaded comment system
- Related content suggestions

### 👤 **Profile**
- User metadata and avatar
- Video grid layout
- Follow/unfollow functionality
- Creator statistics

### 📊 **Creator Dashboard**
- Upload new videos
- Analytics and insights
- Content management
- Performance tracking

## 🔒 Privacy & Security

- **No Data Collection**: App doesn't collect or store personal data
- **Client-Side Only**: All processing happens in your browser
- **Encrypted Storage**: Local storage is encrypted where possible
- **Nostr Keys**: Private keys never leave your device
- **Relay Privacy**: Choose your own relays for data sovereignty

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code standards and conventions
- Commit message format
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Nostr Protocol**: For enabling truly decentralized social media
- **shadcn/ui**: For beautiful, accessible UI components
- **Nostrify**: For excellent Nostr integration tools
- **Blossom**: For decentralized file storage
- **Lightning Network**: For enabling micropayments

## 🔗 Links

- **Live Demo**: [vlogstr.com](https://vlogstr.com)
- **Nostr Protocol**: [nostr.com](https://nostr.com)
- **Documentation**: [docs.vlogstr.com](https://docs.vlogstr.com)
- **Community**: Find us on Nostr with #vlogstr

---

**Built with ❤️ for the decentralized future**

*Vibed with [MKStack](https://soapbox.pub/mkstack)*