import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TwitchEmote } from '../../types/twitch';

@Pipe({
  name: 'twitchMessage',
  standalone: true,
})
export class TwitchMessagePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, emotes: Map<string, TwitchEmote>): SafeHtml {
    let message = this.sanitizer.sanitize(SecurityContext.HTML, value);
    if (!message) return '';

    message = message.replaceAll('>', '&gt;').replaceAll('<', '&lt;');

    // replace links with <a> tags
    const matches = message.match(/(https?:\/\/[^\s]+)/g);
    if (matches) {
      for (const match of matches) {
        message = message.replaceAll(
          match,
          `<a class="text-blue-500 hover:underline" href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`,
        );
      }
    }

    for (const [identifier, emote] of emotes) {
      message = message.replaceAll(
        identifier,
        `<img class="inline" src="${emote.url.small.url}" height="${emote.url.small.height}" width="${emote.url.small.width}" alt="${emote.name}" />`,
      );
    }

    return this.sanitizer.bypassSecurityTrustHtml(message);
  }
}
