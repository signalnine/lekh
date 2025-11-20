// Fetch and display recent GitHub commits from public repos
(function() {
  const GITHUB_USERNAME = 'signalnine';
  const COMMITS_LIMIT = 5;

  async function fetchRecentCommits() {
    const container = document.getElementById('github-commits');
    if (!container) return;

    try {
      // First, get user's public repositories
      const reposResponse = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=10`
      );

      if (!reposResponse.ok) {
        throw new Error(`GitHub API error: ${reposResponse.status}`);
      }

      const repos = await reposResponse.json();

      // Fetch commits from multiple repos and merge by date
      const allCommits = [];

      // Fetch commits from top repos in parallel
      const commitPromises = repos.slice(0, 5).map(async (repo) => {
        try {
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/commits?per_page=10`
          );

          if (commitsResponse.ok) {
            const repoCommits = await commitsResponse.json();
            return repoCommits.map(commit => ({
              message: commit.commit.message,
              sha: commit.sha,
              author: commit.commit.author.name,
              date: commit.commit.author.date,
              url: commit.html_url,
              repo: repo.full_name
            }));
          }
        } catch (err) {
          console.log(`Skipped ${repo.full_name}:`, err);
        }
        return [];
      });

      // Wait for all fetches to complete
      const commitArrays = await Promise.all(commitPromises);

      // Flatten and merge all commits
      for (const repoCommits of commitArrays) {
        allCommits.push(...repoCommits);
      }

      // Sort all commits by date (newest first)
      allCommits.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Take only the most recent commits across all repos
      const commits = allCommits.slice(0, COMMITS_LIMIT);

      // Clear container
      container.textContent = '';

      if (commits.length === 0) {
        const noCommits = document.createElement('p');
        noCommits.className = 'text-secondary';
        noCommits.textContent = 'No recent commits';
        container.appendChild(noCommits);
        return;
      }

      commits.forEach(commit => {
        const date = new Date(commit.date);
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Get first line of commit message
        const message = commit.message.split('\n')[0];
        const truncatedMessage = message.length > 60
          ? message.substring(0, 60) + '...'
          : message;

        // Create commit item container
        const commitItem = document.createElement('div');
        commitItem.className = 'commit-item';

        // Create commit link
        const link = document.createElement('a');
        link.href = commit.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = truncatedMessage;

        // Create meta container
        const meta = document.createElement('div');
        meta.className = 'commit-meta';

        // Repo name
        const repoName = document.createElement('span');
        repoName.className = 'commit-repo';
        repoName.textContent = commit.repo.split('/')[1];

        // Separator 1
        const sep1 = document.createElement('span');
        sep1.className = 'commit-separator';
        sep1.textContent = ' • ';

        // Time
        const time = document.createElement('time');
        time.textContent = formattedDate;

        // Separator 2
        const sep2 = document.createElement('span');
        sep2.className = 'commit-separator';
        sep2.textContent = ' • ';

        // SHA
        const sha = document.createElement('code');
        sha.className = 'commit-sha';
        sha.textContent = commit.sha.substring(0, 7);

        // Assemble meta
        meta.appendChild(repoName);
        meta.appendChild(sep1);
        meta.appendChild(time);
        meta.appendChild(sep2);
        meta.appendChild(sha);

        // Assemble commit item
        commitItem.appendChild(link);
        commitItem.appendChild(meta);

        // Add to container
        container.appendChild(commitItem);
      });

    } catch (error) {
      console.error('Failed to fetch GitHub commits:', error);
      container.textContent = '';
      const errorMsg = document.createElement('p');
      errorMsg.className = 'text-secondary';
      errorMsg.textContent = 'Unable to load recent commits';
      container.appendChild(errorMsg);
    }
  }

  // Load commits when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchRecentCommits);
  } else {
    fetchRecentCommits();
  }
})();
