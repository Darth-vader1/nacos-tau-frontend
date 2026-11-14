// assets/js/team-members.js
// One definition of "who is on a hackathon team", used by every page that
// shows teams, so counts always agree.
//
// A team = the leader + the teammates listed in team_members. team_members
// can also hold internal rows ([ROLE_REQ], [LEADER_META]) and, because the
// registration form allowed it, the leader typing themselves in as a
// teammate. Those are never counted as extra members.
(function (root) {
  'use strict';

  const META_ROWS = new Set(['[ROLE_REQ]', '[LEADER_META]']);
  const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

  /** Leader email + name, from a leader profile or the embedded [LEADER_META] row. */
  function leaderIdentity(rawMembers, leader) {
    const list = Array.isArray(rawMembers) ? rawMembers : [];
    const meta = list.find(m => m && m.name === '[LEADER_META]') || {};
    const l = leader || {};
    const fullName = l.name || [l.first_name, l.last_name].filter(Boolean).join(' ') || meta.leader_name || '';
    return { email: norm(l.email || meta.email), name: norm(fullName) };
  }

  /**
   * Is this member row the leader themself? Email decides; without an email,
   * a matching name or a "Leader"/"Team Lead" role (the placeholder row the
   * admin dashboard saves for teams it adds by hand) also counts as the leader.
   */
  function isLeaderRow(member, identity) {
    const email = norm(member && member.email);
    if (identity.email && email) return email === identity.email;
    if (!email && /^(team )?lead(er)?$/.test(norm(member && member.role))) return true;
    const name = norm(member && member.name);
    return !!(identity.name && name && name === identity.name);
  }

  /** Teammates only: no internal rows, no duplicate of the leader. */
  function teammatesOf(rawMembers, leader) {
    const list = Array.isArray(rawMembers) ? rawMembers : [];
    const identity = leaderIdentity(list, leader);
    return list.filter(m => m && !META_ROWS.has(m.name) && !isLeaderRow(m, identity));
  }

  /** Total people on the team, leader included. */
  function teamSize(rawMembers, leader) {
    return teammatesOf(rawMembers, leader).length + 1;
  }

  const api = { teammatesOf, teamSize, isLeaderRow, leaderIdentity };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else if (root) root.NacosTeams = Object.assign(root.NacosTeams || {}, api);
})(typeof window !== 'undefined' ? window : this);
