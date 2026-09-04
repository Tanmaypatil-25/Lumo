# Changelog

All notable changes to Lumo will be documented in this file.

The project follows a versioned release process so that major features,
improvements, fixes, and architectural changes can be tracked over time.

---

## [2.0.0] - 2026-09-04

### Added

- Complete Lumo 2.0 visual design system
- New Lumo brand mark, wordmark, favicon, and default avatar
- Full-screen responsive application shell
- Redesigned conversation sidebar
- Redesigned conversation header
- Redesigned message composer
- Redesigned conversation details experience
- Redesigned authentication experience
- Redesigned profile settings experience
- Mobile conversation navigation
- Mobile full-screen conversation details
- Touch-friendly message action controls
- Responsive layouts for mobile, tablet, and desktop
- Accessible labels and interaction semantics across key controls
- Reduced-motion support for users who prefer less animation
- Improved keyboard interaction for dialogs, search, forms, and message controls

### Improved

- Overall application visual hierarchy and consistency
- Conversation navigation and sidebar usability
- Message bubble styling and message grouping
- Image message presentation and caption layout
- Message search interface and result navigation
- Message editing and deletion interactions
- Shared media presentation
- Conversation details layout and interactions
- Login and signup flow presentation
- Signup progress feedback
- Password visibility controls
- Profile editing workflow
- Live profile preview experience
- Profile image selection and validation feedback
- Loading and disabled states across authentication and profile forms
- Mobile touch targets and interaction feedback
- Responsive spacing and typography
- Empty conversation presentation
- Focus and keyboard accessibility
- Motion and transition behavior
- Media attachment preview and composer experience
- Scroll behavior while navigating conversation history

### Fixed

- Conversation layout issues across smaller viewport sizes
- Conversation details opening incorrectly on mobile
- Empty conversation state collapsing on desktop
- Horizontal overflow in responsive layouts
- Oversized image message bubbles
- Incorrect image caption sizing and wrapping
- Mobile message action menus remaining open after outside interaction
- Message pagination scrolling the user back to the bottom
- Viewport position changing when older messages are loaded
- Unwanted focus outlines on text inputs and message composer fields
- Responsive spacing and alignment inconsistencies across authentication and profile pages

### Accessibility

- Added reduced-motion support across interactive UI elements
- Improved keyboard focus behavior
- Improved accessible labels for buttons and form controls
- Improved search semantics
- Improved delete confirmation dialog semantics
- Improved authentication form semantics
- Improved profile form semantics
- Improved status and loading feedback
- Improved keyboard and touch interaction across message controls

### Changed

- Replaced the original tutorial-oriented interface with the Lumo 2.0 design system
- Replaced legacy tutorial assets with dedicated Lumo branding
- Updated the application to a modern dark glass-inspired visual language
- Standardized surfaces, borders, spacing, typography, radii, and interaction states
- Improved responsive navigation behavior between conversations, chat, and conversation details
- Refined media messages into compact chat-oriented cards

---

## [1.0.0] - 2026-09-02

### Added

- User authentication with signup, login, logout, and protected routes
- JWT-based authentication for REST APIs
- Authenticated Socket.IO connections
- Real-time one-to-one messaging
- Text message support
- Image message support
- Online and offline presence indicators
- Unread message counts
- Real-time typing indicators
- Sent and Seen message status
- Real-time message editing
- Edited message indicator
- Real-time message deletion
- Cloudinary image cleanup when image messages are deleted
- Conversation-wide message search
- Case-insensitive partial message matching
- Cursor-based message pagination
- User search in the conversation sidebar
- Profile editing for name, bio, and profile picture
- Loading states for conversations and messages
- Empty conversation states
- API error states with retry support
- Older-message loading feedback

### Improved

- Authentication flow and token handling
- Socket authentication and user identity validation
- Message synchronization across active browser sessions
- Read receipt synchronization between users
- Multi-tab socket presence handling
- Message loading performance using pagination
- Sidebar unread-message aggregation
- MongoDB indexes for frequently queried message fields
- Image upload validation and size restrictions
- Environment variable validation during server startup
- Frontend context state management
- React context memoization and callback stability
- API response consistency
- Cloudinary service organization
- Backend controller structure
- Message input focus for consecutive messaging
- Conversation loading and scrolling behavior
- Scroll position preservation while loading older messages
- Application feedback during asynchronous operations

### Fixed

- Insecure Socket.IO user identity handling
- Overly permissive Socket.IO CORS configuration
- Message receiver field naming inconsistencies
- Incorrect read-receipt event routing
- Duplicate unread message state updates
- Duplicate message-page loading in conversations with more than 20 messages
- Initial chat auto-scroll accidentally triggering pagination
- Message input losing focus after sending
- Unstable message and media list keys
- Sidebar search state and filtering issues
- Profile image preview cleanup
- Error handling across message and authentication requests
- Remaining actionable frontend lint warnings discovered during release testing

### Security

- Added authenticated Socket.IO handshakes
- Restricted socket connections to the configured frontend origin
- Added JWT expiration handling
- Added protected message and profile routes
- Added sender ownership validation for message editing
- Added sender ownership validation for message deletion
- Added receiver authorization for marking messages as seen
- Added message ID and user ID validation
- Added message length restrictions
- Added image type and image size validation
- Added required environment variable validation

### Architecture

- Extracted Cloudinary operations into a dedicated service
- Added centralized backend response helpers
- Added centralized frontend and backend configuration constants
- Added dedicated socket presence management
- Improved React AuthContext and ChatContext architecture
- Added environment configuration validation
- Improved message pagination architecture
- Reduced unnecessary data fetching and state updates
- Cleaned up unused tutorial code and legacy implementation details