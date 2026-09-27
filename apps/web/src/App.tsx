import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/Toaster";
import Layout from "./components/layout/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import OrganizationDetail from "./pages/OrganizationDetail";
import Members from "./pages/Members";
import Elections from "./pages/Elections";
import CreateElection from "./pages/CreateElection";
import ElectionDetail from "./pages/ElectionDetail";
import VotePage from "./pages/VotePage";
import ElectionResults from "./pages/ElectionResults";
import Proposals from "./pages/Proposals";
import CreateProposal from "./pages/CreateProposal";
import ProposalDetail from "./pages/ProposalDetail";
import Tenders from "./pages/Tenders";
import CreateTender from "./pages/CreateTender";
import TenderDetail from "./pages/TenderDetail";
import TenderBids from "./pages/TenderBids";
import Documents from "./pages/Documents";
import AIAssistant from "./pages/AIAssistant";
import Analytics from "./pages/Analytics";
import Audit from "./pages/Audit";
import Reputation from "./pages/Reputation";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/organizations/:id" element={<OrganizationDetail />} />
          <Route path="/members" element={<Members />} />
          <Route path="/elections" element={<Elections />} />
          <Route path="/elections/create" element={<CreateElection />} />
          <Route path="/elections/:id" element={<ElectionDetail />} />
          <Route path="/elections/:id/vote" element={<VotePage />} />
          <Route path="/elections/:id/results" element={<ElectionResults />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/proposals/create" element={<CreateProposal />} />
          <Route path="/proposals/:id" element={<ProposalDetail />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/tenders/create" element={<CreateTender />} />
          <Route path="/tenders/:id" element={<TenderDetail />} />
          <Route path="/tenders/:id/bids" element={<TenderBids />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/reputation" element={<Reputation />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
