import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { CardType } from '@/types/retro';

interface ReportCardData {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  comments: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }[];
}

interface ReportActionData {
  id: string;
  text: string;
  completed: boolean;
  assignee: string;
  linkedCardId?: string;
  linkedCardContent?: string;
  linkedCardType?: CardType;
}

interface RetroReportProps {
  retroName: string;
  teamName: string;
  createdAt: string;
  cards: ReportCardData[];
  actions: ReportActionData[];
}

const RetroReport: React.FC<RetroReportProps> = ({
  retroName,
  teamName,
  createdAt,
  cards,
  actions
}) => {
  // Genera il contenuto HTML del report
  const generateReportContent = () => {
    // Group cards by type
    const hotCards = cards.filter(card => card.type === 'hot');
    const disappointmentCards = cards.filter(card => card.type === 'disappointment');
    const fantasyCards = cards.filter(card => card.type === 'fantasy');
    
    // Sort cards by votes (descending)
    const sortByVotes = (a: ReportCardData, b: ReportCardData) => b.votes - a.votes;
    hotCards.sort(sortByVotes);
    disappointmentCards.sort(sortByVotes);
    fantasyCards.sort(sortByVotes);
    
    // Generate HTML content
    let reportContent = `
      <html>
      <head>
        <title>Retro Report: ${retroName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          h1 { 
            color: #F97316; 
            border-bottom: 2px solid #F97316;
            padding-bottom: 10px;
          }
          h2 { 
            color: #F97316; 
            margin-top: 30px;
          }
          .card {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          .hot-card { border-left: 5px solid #22c55e; }
          .disappointment-card { border-left: 5px solid #ef4444; }
          .fantasy-card { border-left: 5px solid #F97316; }
          .card-meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .card-content {
            font-size: 16px;
            margin-bottom: 15px;
          }
          .comments {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
          }
          .comment {
            padding: 10px;
            background-color: #f0f0f0;
            margin-bottom: 10px;
            border-radius: 5px;
            font-size: 14px;
          }
          .comment-meta {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .action-item {
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .action-completed {
            background-color: #f0fff4;
            border-left: 5px solid #22c55e;
          }
          .action-pending {
            border-left: 5px solid #F97316;
          }
          .linked-card {
            font-size: 12px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <h1>Retrospective Report: ${retroName}</h1>
        <p>Team: ${teamName}</p>
        <p>Created: ${new Date(createdAt).toLocaleDateString()}</p>
        
        <h2>🔥 Hot Moments</h2>
    `;
    
    if (hotCards.length === 0) {
      reportContent += `<p>No hot moments were added in this retrospective.</p>`;
    } else {
      hotCards.forEach(card => {
        reportContent += `
          <div class="card hot-card">
            <div class="card-meta">Posted by ${card.author} • ${card.votes} vote${card.votes !== 1 ? 's' : ''}</div>
            <div class="card-content">${card.content}</div>
            
            ${card.comments.length > 0 ? `
              <div class="comments">
                <h4>Comments (${card.comments.length})</h4>
                ${card.comments.map(comment => `
                  <div class="comment">
                    <div class="comment-meta">${comment.author} • ${new Date(comment.createdAt).toLocaleString()}</div>
                    ${comment.content}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      });
    }
    
    reportContent += `<h2>😢 Disappointments</h2>`;
    
    if (disappointmentCards.length === 0) {
      reportContent += `<p>No disappointments were added in this retrospective.</p>`;
    } else {
      disappointmentCards.forEach(card => {
        reportContent += `
          <div class="card disappointment-card">
            <div class="card-meta">Posted by ${card.author} • ${card.votes} vote${card.votes !== 1 ? 's' : ''}</div>
            <div class="card-content">${card.content}</div>
            
            ${card.comments.length > 0 ? `
              <div class="comments">
                <h4>Comments (${card.comments.length})</h4>
                ${card.comments.map(comment => `
                  <div class="comment">
                    <div class="comment-meta">${comment.author} • ${new Date(comment.createdAt).toLocaleString()}</div>
                    ${comment.content}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      });
    }
    
    reportContent += `<h2>✨ Team Fantasies</h2>`;
    
    if (fantasyCards.length === 0) {
      reportContent += `<p>No team fantasies were added in this retrospective.</p>`;
    } else {
      fantasyCards.forEach(card => {
        reportContent += `
          <div class="card fantasy-card">
            <div class="card-meta">Posted by ${card.author} • ${card.votes} vote${card.votes !== 1 ? 's' : ''}</div>
            <div class="card-content">${card.content}</div>
            
            ${card.comments.length > 0 ? `
              <div class="comments">
                <h4>Comments (${card.comments.length})</h4>
                ${card.comments.map(comment => `
                  <div class="comment">
                    <div class="comment-meta">${comment.author} • ${new Date(comment.createdAt).toLocaleString()}</div>
                    ${comment.content}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      });
    }
    
    reportContent += `<h2>📋 Action Items</h2>`;
    
    if (actions.length === 0) {
      reportContent += `<p>No action items were created in this retrospective.</p>`;
    } else {
      actions.forEach(action => {
        reportContent += `
          <div class="action-item ${action.completed ? 'action-completed' : 'action-pending'}">
            <h4>${action.completed ? '✓ ' : ''}${action.text}</h4>
            ${action.assignee ? `<p>Assigned to: ${action.assignee}</p>` : ''}
            ${action.linkedCardContent ? `
              <div class="linked-card">
                Linked to card: "${action.linkedCardContent.substring(0, 50)}${action.linkedCardContent.length > 50 ? '...' : ''}"
              </div>
            ` : ''}
          </div>
        `;
      });
    }
    
    reportContent += `
        <footer style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
          Generated by PornoRetro.it on ${new Date().toLocaleDateString()}
        </footer>
      </body>
      </html>
    `;
    
    return reportContent;
  };

  // Funzione per generare un report HTML e scaricarlo
  const generateReport = () => {
    // Create a blob and download
    const blob = new Blob([generateReportContent()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${retroName.replace(/\s+/g, '-')}-report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex space-x-2">
      <Button 
        onClick={generateReport} 
        className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
      >
        <FileText className="w-4 h-4 mr-2" />
        Download HTML Report
      </Button>
    </div>
  );
};

export default RetroReport;
