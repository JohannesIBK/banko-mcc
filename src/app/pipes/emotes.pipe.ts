import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TwitchEmote } from '../../types/twitch';

@Pipe({
  name: 'emotes',
  standalone: true,
})
export class EmotesPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, emotes: Map<string, TwitchEmote>): SafeHtml {
    let message = this.sanitizer.sanitize(SecurityContext.HTML, value);
    if (!message) return '';

    message = message.replaceAll('>', '&gt;').replaceAll('<', '&lt;');

    for (const [identifier, emote] of emotes) {
      message = message.replaceAll(
        identifier,
        `<img class="inline" src="${emote.url.small.url}" height="${emote.url.small.height}" width="${emote.url.small.width}" alt="${emote.name}" />`,
      );
    }

    return this.sanitizer.bypassSecurityTrustHtml(message);
  }
}
