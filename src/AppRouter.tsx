import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { SidebarLayout } from "./components/SidebarLayout";

import Index from "./pages/Index";
import FeedPage from "./pages/FeedPage";
import Discover from "./pages/Discover";
import CreatorDashboard from "./pages/CreatorDashboard";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import VideoPage from "./pages/VideoPage";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<SidebarLayout><Index /></SidebarLayout>} />
        <Route path="/feed" element={<SidebarLayout><FeedPage /></SidebarLayout>} />
        <Route path="/discover" element={<SidebarLayout><Discover /></SidebarLayout>} />
        <Route path="/dashboard" element={<SidebarLayout><CreatorDashboard /></SidebarLayout>} />
        <Route path="/profile" element={<SidebarLayout><Profile /></SidebarLayout>} />
        <Route path="/user/:pubkey" element={<SidebarLayout><UserProfile /></SidebarLayout>} />
        <Route path="/settings" element={<SidebarLayout><Settings /></SidebarLayout>} />
        <Route path="/video/:eventId" element={<SidebarLayout><VideoPage /></SidebarLayout>} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;