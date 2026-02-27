// duration.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(minutes: number): string {
    if (!minutes || minutes === 0) return '0 min';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
    }
  }
}