const LOGO_MAP = {
  github: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
  google: 'https://www.google.com/favicon.ico',
  gitlab: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg',
  aws: 'https://a0.awsstatic.com/main/images/logos/aws-logo-care-h60.png',
  amazon: 'https://www.amazon.com/favicon.ico',
  outlook: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
  microsoft: 'https://www.microsoft.com/favicon.ico',
  facebook: 'https://www.facebook.com/favicon.ico',
  digitalocean: 'https://www.digitalocean.com/favicon.ico',
  heroku: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/heroku/heroku-original.svg',
  azure: 'https://azure.microsoft.com/favicon.ico',
  vingroup: 'https://www.vingroup.net/favicon.ico',
  vinfast: 'https://vinfastauto.com/favicon.ico',
  binance: 'https://binance.com/favicon.ico',
  discord: 'https://discord.com/favicon.ico',
  steam: 'https://store.steampowered.com/favicon.ico',
  epicgames: 'https://www.epicgames.com/favicon.ico',
  fortinet: 'https://www.fortinet.com/favicon.ico',
  cisco: 'https://www.cisco.com/favicon.ico',
  openvpn: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNzhkNCI+PHBhdGggZD0iTTEyLjY1IDEwQzExLjgzIDcuNjcgOS42MSA2IDcgNmMtMy4zMSAwLTYgMi42OS02IDZzMi42OSA2IDYgNmMyLjYxIDAgNC44My0xLjY3IDUuNjUtNEgxN3Y0aDR2LTRoMnYtNEgxMi42NXpNNyAxNGMtMS4xIDAtMi0uOS0yLTJzLjktMiAyLTIgMiAuOSAyIDItLjkgMi0yIDJ6Ii8+PC9zdmc+',
  vpn: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwNzhkNCI+PHBhdGggZD0iTTEyLjY1IDEwQzExLjgzIDcuNjcgOS42MSA2IDcgNmMtMy4zMSAwLTYgMi42OS02IDZzMi42OSA2IDYgNmMyLjYxIDAgNC44My0xLjY3IDUuNjUtNEgxN3Y0aDR2LTRoMnYtNEgxMi42NXpNNyAxNGMtMS4xIDAtMi0uOS0yLTJzLjktMiAyLTIgMiAuOSAyIDItLjkgMi0yIDJ6Ii8+PC9zdmc+',
  twitter: 'https://twitter.com/favicon.ico',
  x: 'https://twitter.com/favicon.ico',
  apple: 'https://www.apple.com/favicon.ico',
  dropbox: 'https://www.dropbox.com/favicon.ico',
  slack: 'https://slack.com/favicon.ico',
  trello: 'https://trello.com/favicon.ico'
};

export const accountUtils = {
  getLogo(issuer = '') {
    const key = issuer.toLowerCase().replace(/\s/g, '');
    for (const [name, url] of Object.entries(LOGO_MAP)) {
      if (key.includes(name)) return url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(issuer)}&background=random&color=fff`;
  },

  getCategoryColor(category) {
    const colors = {
      Work: '#0078d4',       // Blue
      Personal: '#107c10',   // Green
      Finance: '#d83b01',    // Orange/Red
      Social: '#e3008c',     // Pink
      Gaming: '#600000',     // Dark Red
      VPN: '#004578',        // Navy Blue
      Other: '#605e5c'       // Gray
    };
    return colors[category] || '#638bff';
  }
};
