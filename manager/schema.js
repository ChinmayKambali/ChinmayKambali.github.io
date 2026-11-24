// Defines every category in the portfolio and the fields the manager asks for.
// To add a new field later: add it here AND show it in docs/app.js.
//
// Field types: text, textarea, url, email, month, select, tags, lines,
//              image, file, checkbox, color
module.exports = {
  categories: [
    {
      key: 'profile', label: 'Profile & Contact', icon: '👤', single: true,
      help: 'Your name, headline, bio, photo, resume and social links. Shown in the top section, About and Contact.',
      fields: [
        { key: 'name', label: 'Full name', type: 'text', required: true },
        { key: 'title', label: 'Headline', type: 'text', placeholder: 'AI & Machine Learning · Full-Stack Development' },
        { key: 'tagline', label: 'Tagline (one or two sentences under your name)', type: 'textarea', rows: 2 },
        { key: 'about', label: 'About me', type: 'textarea', rows: 7, help: 'Leave a blank line between paragraphs.' },
        { key: 'photo', label: 'Profile photo', type: 'image', help: 'Square photos look best. Leave empty and no photo is shown.' },
        { key: 'availability', label: 'Availability badge', type: 'text', placeholder: 'Open to new opportunities', help: 'Leave empty to hide the green badge.' },
        { key: 'location', label: 'Location', type: 'text', placeholder: 'Bengaluru, India' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'text', help: 'Optional. Anything here is public on the website.' },
        { key: 'resume', label: 'Resume (PDF)', type: 'file', accept: '.pdf' },
        { key: 'github', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/…' },
        { key: 'linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'https://www.linkedin.com/in/…' },
        { key: 'leetcode', label: 'LeetCode URL', type: 'url', placeholder: 'https://leetcode.com/u/…' },
        { key: 'twitter', label: 'X / Twitter URL', type: 'url' },
        { key: 'website', label: 'Other website / blog', type: 'url' }
      ]
    },
    {
      key: 'projects', label: 'Projects', icon: '🚀', titleField: 'title', subtitleField: 'category',
      help: 'Each project becomes a card. Featured projects are shown first. Visitors can filter by category.',
      fields: [
        { key: 'title', label: 'Project name', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', placeholder: 'AI / ML, Full-Stack Web, IoT / Embedded…', help: 'Used for the filter buttons. Reuse the same spelling to group projects.', suggestFrom: 'category' },
        { key: 'summary', label: 'Short summary (shown on the card)', type: 'textarea', rows: 2, required: true },
        { key: 'description', label: 'Full description (shown when the card is clicked)', type: 'textarea', rows: 6, help: 'Leave a blank line between paragraphs.' },
        { key: 'tech', label: 'Tech stack', type: 'tags', placeholder: 'Type a technology and press Enter' },
        { key: 'image', label: 'Screenshot / cover image', type: 'image', help: 'Optional. Without one, a colour card with the project name is shown.' },
        { key: 'liveUrl', label: 'Live demo URL', type: 'url' },
        { key: 'repoUrl', label: 'Source code URL', type: 'url' },
        { key: 'date', label: 'Completed (month)', type: 'month' },
        { key: 'featured', label: 'Featured project (show first, with a ★ badge)', type: 'checkbox' }
      ]
    },
    {
      key: 'experience', label: 'Experience', icon: '💼', titleField: 'role', subtitleField: 'company',
      help: 'Jobs, internships, freelance work. Newest at the top.',
      fields: [
        { key: 'role', label: 'Role / position', type: 'text', required: true },
        { key: 'company', label: 'Company / organisation', type: 'text', required: true },
        { key: 'companyUrl', label: 'Company website', type: 'url' },
        { key: 'type', label: 'Type', type: 'select', options: ['Internship', 'Full-time', 'Part-time', 'Freelance', 'Contract', 'Volunteer', 'Research'] },
        { key: 'location', label: 'Location', type: 'text', placeholder: 'Bengaluru, Karnataka / Remote' },
        { key: 'start', label: 'Start month', type: 'month' },
        { key: 'end', label: 'End month', type: 'month' },
        { key: 'current', label: 'I currently work here', type: 'checkbox' },
        { key: 'summary', label: 'One-line summary (optional)', type: 'textarea', rows: 2 },
        { key: 'highlights', label: 'What you did (one point per line)', type: 'lines', rows: 5 },
        { key: 'tech', label: 'Tools & tech used', type: 'tags' }
      ]
    },
    {
      key: 'skills', label: 'Skills', icon: '🧠', titleField: 'group', subtitleField: 'items',
      help: 'Group your skills (e.g. Languages, Databases). Each group becomes a card.',
      fields: [
        { key: 'group', label: 'Group name', type: 'text', required: true, placeholder: 'Languages' },
        { key: 'items', label: 'Skills in this group', type: 'tags', placeholder: 'Type a skill and press Enter' }
      ]
    },
    {
      key: 'education', label: 'Education', icon: '🎓', titleField: 'institution', subtitleField: 'degree',
      help: 'Degrees and schools. Newest at the top.',
      fields: [
        { key: 'institution', label: 'Institution', type: 'text', required: true },
        { key: 'degree', label: 'Degree / board', type: 'text', placeholder: 'B.Tech, CBSE (Class XII)…' },
        { key: 'field', label: 'Field of study', type: 'text', placeholder: 'Computer Science Engineering' },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'start', label: 'Start month', type: 'month' },
        { key: 'end', label: 'End / graduation', type: 'text', placeholder: '2027-06 or "Expected June 2027"', help: 'Use YYYY-MM (e.g. 2023-03) or plain text.' },
        { key: 'grade', label: 'Grade / CGPA / %', type: 'text' },
        { key: 'highlights', label: 'Highlights (one per line, optional)', type: 'lines', rows: 3 }
      ]
    },
    {
      key: 'certifications', label: 'Certifications', icon: '📜', titleField: 'name', subtitleField: 'issuer',
      help: 'Courses, licences and job simulations. Attach the certificate PDF and/or a verify link.',
      fields: [
        { key: 'name', label: 'Certificate name', type: 'text', required: true },
        { key: 'issuer', label: 'Issued by', type: 'text', placeholder: 'IBM (Coursera)' },
        { key: 'date', label: 'Issue month', type: 'month' },
        { key: 'credentialId', label: 'Credential ID', type: 'text' },
        { key: 'url', label: 'Verification URL', type: 'url' },
        { key: 'file', label: 'Certificate file (PDF or image)', type: 'file', accept: '.pdf,image/*' }
      ]
    },
    {
      key: 'achievements', label: 'Achievements', icon: '🏆', titleField: 'title', subtitleField: 'date',
      help: 'Awards, hackathons, rankings, open-source contributions, leadership roles.',
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'date', label: 'Month', type: 'month' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { key: 'url', label: 'Link (optional)', type: 'url' }
      ]
    },
    {
      key: 'testimonials', label: 'Testimonials', icon: '💬', titleField: 'name', subtitleField: 'role',
      help: 'Quotes from managers, mentors, clients or teammates. The section stays hidden until you add one.',
      fields: [
        { key: 'name', label: 'Person\'s name', type: 'text', required: true },
        { key: 'role', label: 'Their role & company', type: 'text', placeholder: 'Engineering Manager, Cloudside' },
        { key: 'quote', label: 'What they said', type: 'textarea', rows: 4, required: true },
        { key: 'photo', label: 'Their photo (optional)', type: 'image' },
        { key: 'url', label: 'Their LinkedIn (optional)', type: 'url' }
      ]
    },
    {
      key: 'settings', label: 'Site Settings', icon: '⚙️', single: true,
      help: 'Colour and the text shown in Google results and link previews.',
      fields: [
        { key: 'accent', label: 'Accent colour', type: 'color' },
        { key: 'siteTitle', label: 'Browser tab title', type: 'text' },
        { key: 'metaDescription', label: 'Description for Google & link previews', type: 'textarea', rows: 2 }
      ]
    }
  ]
};
