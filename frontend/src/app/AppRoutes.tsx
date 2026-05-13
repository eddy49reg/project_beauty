import { Route, Routes } from 'react-router-dom';
import { ApplyParticipationPage } from '../pages/ApplyParticipationPage/ApplyParticipationPage';
import { ChampionshipFormPage } from '../pages/ChampionshipFormPage/ChampionshipFormPage';
import { MembershipFormPage } from '../pages/MembershipFormPage/MembershipFormPage';
import { MembershipsListPage } from '../pages/MembershipsListPage/MembershipsListPage';
import { JudgeWorksListPage } from '../pages/JudgeWorksListPage/JudgeWorksListPage';
import { JudgeWorkScorePage } from '../pages/JudgeWorkScorePage/JudgeWorkScorePage';
import { NominationFormPage } from '../pages/NominationFormPage/NominationFormPage';
import { NominationsListPage } from '../pages/NominationsListPage/NominationsListPage';
import { WorkFormPage } from '../pages/WorkFormPage';
import { WorksListPage } from '../pages/WorksListPage/WorksListPage';
import { AppShell } from '../widgets/AppShell';
import { AdminUsersGate } from './AdminUsersGate';
import { ChampionshipsListGate } from './ChampionshipsListGate';
import { LoggedInGate } from './LoggedInGate';
import { OrganizerGate } from './OrganizerGate';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ResultsPage } from '../pages/ResultsPage/ResultsPage';

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/championships" element={<ChampionshipsListGate />} />
        <Route
          path="/championships/new"
          element={
            <OrganizerGate>
              <ChampionshipFormPage />
            </OrganizerGate>
          }
        />
        <Route
          path="/championships/:id/edit"
          element={
            <LoggedInGate>
              <ChampionshipFormPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/apply"
          element={
            <LoggedInGate>
              <ApplyParticipationPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/nominations"
          element={
            <LoggedInGate>
              <NominationsListPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/nominations/new"
          element={
            <LoggedInGate>
              <NominationFormPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/nominations/:nominationId/edit"
          element={
            <LoggedInGate>
              <NominationFormPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/memberships"
          element={
            <LoggedInGate>
              <MembershipsListPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/memberships/new"
          element={
            <LoggedInGate>
              <MembershipFormPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/judging/works"
          element={
            <LoggedInGate>
              <JudgeWorksListPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/judging/works/:workId"
          element={
            <LoggedInGate>
              <JudgeWorkScorePage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/works/my"
          element={
            <LoggedInGate>
              <WorksListPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/works/new"
          element={
            <LoggedInGate>
              <WorkFormPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/works/:workId/edit"
          element={
            <LoggedInGate>
              <WorkFormPage />
            </LoggedInGate>
          }
        />
        <Route
          path="/championships/:championshipId/results"
          element={
            <LoggedInGate>
              <ResultsPage />
            </LoggedInGate>
          }
        />
        <Route path="/admin/users" element={<AdminUsersGate />} />
      </Routes>
    </AppShell>
  );
}
