'use client'

import { useState } from 'react'
import InvestmentConceptTool from './investment-concept-tool'
import PraeLuxTool from './praelux-tool'

type ToolId = 'overview' | 'investment'

const tools: { id: ToolId; label: string; description: string }[] = [
  {
    id: 'overview',
    label: 'Entscheidungsübersicht',
    description: 'Gesamtvorteil und Konzeptvergleich',
  },
  {
    id: 'investment',
    label: 'Investmentkonzept',
    description: 'Aufteilung und Kapitalentwicklung',
  },
]

export default function ToolShell() {
  const [activeTool, setActiveTool] = useState<ToolId>('overview')
  const [isOpen, setIsOpen] = useState(false)
  const active = tools.find((tool) => tool.id === activeTool) ?? tools[0]

  function selectTool(tool: ToolId) {
    setActiveTool(tool)
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className={`tool-nav-toggle${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="tool-navigation"
        aria-label={isOpen ? 'Navigation schließen' : 'Navigation öffnen'}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <nav id="tool-navigation" className={`tool-nav-panel${isOpen ? ' open' : ''}`} aria-label="Werkzeug Navigation">
        <strong>Werkzeuge</strong>
        <span>{active.label}</span>
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={tool.id === activeTool ? 'active' : ''}
            onClick={() => selectTool(tool.id)}
          >
            <b>{tool.label}</b>
            <em>{tool.description}</em>
          </button>
        ))}
      </nav>

      {activeTool === 'overview' ? <PraeLuxTool /> : <InvestmentConceptTool />}
    </>
  )
}
