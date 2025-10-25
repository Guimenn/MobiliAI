import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeClockDto } from './dto/create-time-clock.dto';
import { UpdateTimeClockDto } from './dto/update-time-clock.dto';
import { ClockOutDto } from './dto/clock-out.dto';

@Injectable()
export class TimeClockService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtém o horário de início do expediente (prioriza é o horário individual do usuário, depois o da loja)
   */
  private getWorkingStartTime(employee: any, store: any): Date {
    // Primeiro, verificar se o funcionário tem horário individual configurado
    if (employee.workingHours) {
      try {
        const workingHours = employee.workingHours as any;
        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayKey = today.toLowerCase();
        
        // Verificar se há horário específico para o dia da semana
        if (workingHours[dayKey] && workingHours[dayKey].startTime) {
          const [hours, minutes] = workingHours[dayKey].startTime.split(':').map(Number);
          const startTime = new Date();
          startTime.setHours(hours, minutes, 0, 0);
          return startTime;
        } else if (workingHours.default && workingHours.default.startTime) {
          // Usar horário padrão se não houver horário específico para o dia
          const [hours, minutes] = workingHours.default.startTime.split(':').map(Number);
          const startTime = new Date();
          startTime.setHours(hours, minutes, 0, 0);
          return startTime;
        }
      } catch (error) {
        console.error('Erro ao processar horário individual do funcionário:', error);
      }
    }
    
    // Se não houver horário individual, usar o horário da loja
    return this.getStoreStartTime(store);
  }

  /**
   * Obtém o horário de início do expediente da loja para o dia atual
   */
  private getStoreStartTime(store: any): Date {
    const standardStartTime = new Date();
    
    if (store?.workingHours) {
      try {
        const workingHours = store.workingHours as any;
        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayKey = today.toLowerCase();
        
        // Verificar se há horário específico para o dia da semana
        if (workingHours[dayKey] && workingHours[dayKey].startTime) {
          const [hours, minutes] = workingHours[dayKey].startTime.split(':').map(Number);
          standardStartTime.setHours(hours, minutes, 0, 0);
        } else if (workingHours.default && workingHours.default.startTime) {
          // Usar horário padrão se não houver horário específico para o dia
          const [hours, minutes] = workingHours.default.startTime.split(':').map(Number);
          standardStartTime.setHours(hours, minutes, 0, 0);
        } else {
          // Fallback para 8:00 se não houver configuração
          standardStartTime.setHours(8, 0, 0, 0);
        }
      } catch (error) {
        console.error('Erro ao processar horário de expediente:', error);
        // Fallback para 8:00 em caso de erro
        standardStartTime.setHours(8, 0, 0, 0);
      }
    } else {
      // Fallback para 8:00 se não houver configuração de horário
      standardStartTime.setHours(8, 0, 0, 0);
    }
    
    return standardStartTime;
  }

  /**
   * Obtém as configurações de horário (prioriza o horário individual do usuário, depois o da loja)
   */
  private getWorkingConfig(employee: any, store: any): { lunchBreakMinutes: number; regularHoursLimit: number } {
    // Primeiro, verificar se o funcionário tem horário individual configurado
    if (employee.workingHours) {
      try {
        const workingHours = employee.workingHours as any;
        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayKey = today.toLowerCase();
        
        // Verificar configurações específicas do dia ou padrão
        const dayConfig = workingHours[dayKey] || workingHours.default;
        if (dayConfig) {
          return {
            lunchBreakMinutes: dayConfig.lunchBreakMinutes || 60,
            regularHoursLimit: dayConfig.regularHours || 8
          };
        }
      } catch (error) {
        console.error('Erro ao processar configurações individuais do funcionário:', error);
      }
    }
    
    // Se não houver configuração individual, usar a configuração da loja
    return this.getStoreWorkingConfig(store);
  }

  /**
   * Obtém as configurações de horário da loja para o dia atual
   */
  private getStoreWorkingConfig(store: any): { lunchBreakMinutes: number; regularHoursLimit: number } {
    let lunchBreakMinutes = 60; // Padrão: 1 hora
    let regularHoursLimit = 8; // Padrão: 8 horas regulares
    
    if (store?.workingHours) {
      try {
        const workingHours = store.workingHours as any;
        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayKey = today.toLowerCase();
        
        // Verificar configurações específicas do dia ou padrão
        const dayConfig = workingHours[dayKey] || workingHours.default;
        if (dayConfig) {
          if (dayConfig.lunchBreakMinutes) {
            lunchBreakMinutes = dayConfig.lunchBreakMinutes;
          }
          if (dayConfig.regularHours) {
            regularHoursLimit = dayConfig.regularHours;
          }
        }
      } catch (error) {
        console.error('Erro ao processar configurações de horário:', error);
      }
    }
    
    return { lunchBreakMinutes, regularHoursLimit };
  }

  async clockIn(createTimeClockDto: CreateTimeClockDto) {
    const { employeeId, photo, latitude, longitude, address } = createTimeClockDto;
    
    // Verificar se o funcionário existe e está ativo
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        store: true
      }
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    if (!employee.isActive) {
      throw new BadRequestException('Funcionário não está ativo no sistema');
    }

    // Verificar se já existe um ponto de entrada não fechado hoje
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const existingEntry = await this.prisma.timeClock.findFirst({
      where: {
        employeeId,
        date: {
          gte: today
        },
        clockOut: null
      }
    });

    if (existingEntry) {
      throw new BadRequestException('Já existe um ponto de entrada não fechado para hoje');
    }

    // Calcular se está atrasado baseado no horário de expediente (individual ou da loja)
    const currentTime = new Date();
    const standardStartTime = this.getWorkingStartTime(employee, employee.store);
    
    const isLate = currentTime > standardStartTime;
    const minutesLate = isLate ? Math.floor((currentTime.getTime() - standardStartTime.getTime()) / (1000 * 60)) : 0;

    // Criar registro de ponto
    const timeClock = await this.prisma.timeClock.create({
      data: {
        employeeId,
        date: new Date().toISOString().split('T')[0],
        clockIn: currentTime.toTimeString().split(' ')[0].substring(0, 5),
        photo,
        latitude,
        longitude,
        address,
        status: isLate ? 'LATE' : 'PRESENT',
        minutesLate: minutesLate,
        totalHours: 0,
        overtimeHours: 0
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return {
      message: isLate ? `Ponto registrado com ${minutesLate} minutos de atraso` : 'Ponto de entrada registrado com sucesso',
      timeClock,
      isLate,
      minutesLate
    };
  }

  async clockOut(clockOutDto: ClockOutDto) {
    const { employeeId, photo, latitude, longitude, address } = clockOutDto;
    
    // Verificar se o funcionário existe e está ativo
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    if (!employee.isActive) {
      throw new BadRequestException('Funcionário não está ativo no sistema');
    }
    
    // Encontrar o ponto de entrada de hoje
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const existingEntry = await this.prisma.timeClock.findFirst({
      where: {
        employeeId,
        date: {
          gte: today
        },
        clockOut: null
      }
    });

    if (!existingEntry) {
      throw new BadRequestException('Não existe ponto de entrada para fechar');
    }

    const currentTime = new Date();
    const clockOutTime = currentTime.toTimeString().split(' ')[0].substring(0, 5);
    
    // Calcular horas trabalhadas
    const clockInTime = new Date(`2000-01-01T${existingEntry.clockIn}:00`);
    const clockOutTimeObj = new Date(`2000-01-01T${clockOutTime}:00`);
    
    let totalMinutes = (clockOutTimeObj.getTime() - clockInTime.getTime()) / (1000 * 60);
    
    // Obter configurações de horário (individual ou da loja)
    // Buscar a loja do funcionário se necessário
    let store = null;
    if (employee.storeId) {
      store = await this.prisma.store.findUnique({
        where: { id: employee.storeId }
      });
    }
    const { lunchBreakMinutes, regularHoursLimit } = this.getWorkingConfig(employee, store);
    
    // Subtrair tempo de almoço
    totalMinutes -= lunchBreakMinutes;
    
    const totalHours = Math.max(0, totalMinutes / 60);
    const regularHours = Math.min(totalHours, regularHoursLimit);
    const overtimeHours = Math.max(0, totalHours - regularHoursLimit);

    // Atualizar registro de ponto
    const updatedTimeClock = await this.prisma.timeClock.update({
      where: { id: existingEntry.id },
      data: {
        clockOut: clockOutTime,
        clockOutPhoto: photo,
        clockOutLatitude: latitude,
        clockOutLongitude: longitude,
        clockOutAddress: address,
        totalHours,
        regularHours,
        overtimeHours,
        lunchBreakMinutes
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return {
      message: 'Ponto de saída registrado com sucesso',
      timeClock: updatedTimeClock,
      totalHours,
      regularHours,
      overtimeHours
    };
  }

  /**
   * Busca detalhes de um ponto específico
   */
  async getTimeClockDetails(id: string) {
    const timeClock = await this.prisma.timeClock.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!timeClock) {
      throw new NotFoundException('Ponto não encontrado');
    }

    return timeClock;
  }

  async getEmployeeTimeClock(employeeId: string, startDate?: string, endDate?: string) {
    const where: any = { employeeId };
    
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    return this.prisma.timeClock.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async getStoreTimeClock(storeId: string, startDate?: string, endDate?: string) {
    const where: any = {
      employee: {
        storeId
      }
    };
    
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    return this.prisma.timeClock.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async updateTimeClock(id: string, updateTimeClockDto: UpdateTimeClockDto) {
    const timeClock = await this.prisma.timeClock.findUnique({
      where: { id }
    });

    if (!timeClock) {
      throw new NotFoundException('Registro de ponto não encontrado');
    }

    return this.prisma.timeClock.update({
      where: { id },
      data: updateTimeClockDto,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  async deleteTimeClock(id: string) {
    const timeClock = await this.prisma.timeClock.findUnique({
      where: { id }
    });

    if (!timeClock) {
      throw new NotFoundException('Registro de ponto não encontrado');
    }

    return this.prisma.timeClock.delete({
      where: { id }
    });
  }

  async getEmployeeReport(employeeId: string, startDate?: string, endDate?: string) {
    const where: any = { employeeId };
    
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const records = await this.prisma.timeClock.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calcular estatísticas
    const totalDays = records.length;
    const totalHours = records.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const totalOvertime = records.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
    const totalLateMinutes = records.reduce((sum, record) => sum + (record.minutesLate || 0), 0);
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    return {
      records,
      statistics: {
        totalDays,
        totalHours,
        totalOvertime,
        totalLateMinutes,
        averageHours
      }
    };
  }

  async getStoreReport(storeId: string, startDate?: string, endDate?: string) {
    const where: any = {
      employee: {
        storeId
      }
    };
    
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const records = await this.prisma.timeClock.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calcular estatísticas da loja
    const totalRecords = records.length;
    const totalHours = records.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const totalOvertime = records.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
    const totalLateMinutes = records.reduce((sum, record) => sum + (record.minutesLate || 0), 0);

    // Agrupar por funcionário
    const employeeStats = records.reduce((acc, record) => {
      const employeeId = record.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: record.employee,
          totalDays: 0,
          totalHours: 0,
          totalOvertime: 0,
          totalLateMinutes: 0
        };
      }
      acc[employeeId].totalDays++;
      acc[employeeId].totalHours += record.totalHours || 0;
      acc[employeeId].totalOvertime += record.overtimeHours || 0;
      acc[employeeId].totalLateMinutes += record.minutesLate || 0;
      return acc;
    }, {});

    return {
      records,
      statistics: {
        totalRecords,
        totalHours,
        totalOvertime,
        totalLateMinutes
      },
      employeeStats: Object.values(employeeStats)
    };
  }
}
