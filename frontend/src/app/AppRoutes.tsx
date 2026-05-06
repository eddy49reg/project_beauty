import { Route, Routes } from 'react-router-dom';
import { ChampionshipFormPage } from '../pages/ChampionshipFormPage/ChampionshipFormPage';
import { MembershipFormPage } from '../pages/MembershipFormPage/MembershipFormPage';
import { MembershipsListPage } from '../pages/MembershipsListPage/MembershipsListPage';
import { NominationFormPage } from '../pages/NominationFormPage/NominationFormPage';
import { NominationsListPage } from '../pages/NominationsListPage/NominationsListPage';
import { AppShell } from '../widgets/AppShell';
import { AdminUsersGate } from './AdminUsersGate';
import { ChampionshipsListGate } from './ChampionshipsListGate';
import { LoggedInGate } from './LoggedInGate';
import { OrganizerGate } from './OrganizerGate';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

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
            <OrganizerGate>
              <ChampionshipFormPage />
            </OrganizerGate>
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
            <OrganizerGate>
              <NominationFormPage />
            </OrganizerGate>
          }
        />
        <Route
          path="/championships/:championshipId/nominations/:nominationId/edit"
          element={
            <OrganizerGate>
              <NominationFormPage />
            </OrganizerGate>
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
            <OrganizerGate>
              <MembershipFormPage />
            </OrganizerGate>
          }
        />
        <Route path="/admin/users" element={<AdminUsersGate />} />
      </Routes>
    </AppShell>
  );
}
