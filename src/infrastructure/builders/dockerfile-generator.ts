import type { DockerfileConfig, NodeServiceConfig } from './types'

export class DockerfileGenerator {
  static generate(config: DockerfileConfig): string {
    const lines: string[] = []

    lines.push(`FROM ${config.baseImage}`)
    lines.push('')

    if (config.workdir) {
      lines.push(`WORKDIR ${config.workdir}`)
      lines.push('')
    }

    if (config.copyFiles && config.copyFiles.length > 0) {
      for (const file of config.copyFiles) {
        lines.push(`COPY ${file.src} ${file.dest}`)
      }
      lines.push('')
    }

    if (config.runCommands && config.runCommands.length > 0) {
      for (const cmd of config.runCommands) {
        lines.push(`RUN ${cmd}`)
      }
      lines.push('')
    }

    if (config.env && Object.keys(config.env).length > 0) {
      for (const [key, value] of Object.entries(config.env)) {
        lines.push(`ENV ${key}="${value}"`)
      }
      lines.push('')
    }

    if (config.expose && config.expose.length > 0) {
      for (const port of config.expose) {
        lines.push(`EXPOSE ${port}`)
      }
      lines.push('')
    }

    if (config.entrypoint && config.entrypoint.length > 0) {
      lines.push(`ENTRYPOINT ${JSON.stringify(config.entrypoint)}`)
    }

    if (config.cmd && config.cmd.length > 0) {
      lines.push(`CMD ${JSON.stringify(config.cmd)}`)
    }

    return lines.join('\n')
  }

  static generateNodeService(config: NodeServiceConfig): string {
    const baseImage = config.baseImage || 'node:20-alpine'
    const workdir = config.workdir || '/app'
    const port = config.port || 3000

    return this.generate({
      baseImage,
      workdir,
      copyFiles: [
        { src: 'package.json', dest: './' },
        { src: 'yarn.lock*', dest: './' },
        { src: 'package-lock.json*', dest: './' },
      ],
      runCommands: [
        'if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \\',
        '    elif [ -f package-lock.json ]; then npm ci; \\',
        '    else npm install; fi',
      ],
      expose: [port],
      cmd: ['node', config.entryFile],
    })
  }
}
