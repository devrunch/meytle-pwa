import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceArea } from './service-area.entity';
import { CreateServiceAreaDto, UpdateServiceAreaDto } from './dto/service-area.dto';

const SEED_AREAS: Omit<ServiceArea, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Delhi NCR
  { name: 'Central Delhi',  city: 'Delhi NCR',  lat: 28.6448, lng: 77.2167, defaultRadiusKm: 10, displayOrder: 1,  isActive: true },
  { name: 'South Delhi',    city: 'Delhi NCR',  lat: 28.5355, lng: 77.2100, defaultRadiusKm: 12, displayOrder: 2,  isActive: true },
  { name: 'North Delhi',    city: 'Delhi NCR',  lat: 28.7195, lng: 77.2079, defaultRadiusKm: 10, displayOrder: 3,  isActive: true },
  { name: 'Dwarka',         city: 'Delhi NCR',  lat: 28.5921, lng: 77.0460, defaultRadiusKm: 10, displayOrder: 4,  isActive: true },
  { name: 'Gurgaon',        city: 'Delhi NCR',  lat: 28.4595, lng: 77.0266, defaultRadiusKm: 15, displayOrder: 5,  isActive: true },
  { name: 'Noida',          city: 'Delhi NCR',  lat: 28.5355, lng: 77.3910, defaultRadiusKm: 12, displayOrder: 6,  isActive: true },
  { name: 'Faridabad',      city: 'Delhi NCR',  lat: 28.4089, lng: 77.3178, defaultRadiusKm: 10, displayOrder: 7,  isActive: true },
  // Mumbai
  { name: 'South Mumbai',   city: 'Mumbai',     lat: 18.9220, lng: 72.8347, defaultRadiusKm: 8,  displayOrder: 10, isActive: true },
  { name: 'Bandra',         city: 'Mumbai',     lat: 19.0596, lng: 72.8295, defaultRadiusKm: 6,  displayOrder: 11, isActive: true },
  { name: 'Andheri',        city: 'Mumbai',     lat: 19.1136, lng: 72.8697, defaultRadiusKm: 8,  displayOrder: 12, isActive: true },
  { name: 'Powai',          city: 'Mumbai',     lat: 19.1197, lng: 72.9051, defaultRadiusKm: 8,  displayOrder: 13, isActive: true },
  { name: 'Navi Mumbai',    city: 'Mumbai',     lat: 19.0368, lng: 73.0158, defaultRadiusKm: 12, displayOrder: 14, isActive: true },
  { name: 'Thane',          city: 'Mumbai',     lat: 19.2183, lng: 72.9781, defaultRadiusKm: 10, displayOrder: 15, isActive: true },
  // Bangalore
  { name: 'Koramangala',    city: 'Bangalore',  lat: 12.9352, lng: 77.6245, defaultRadiusKm: 8,  displayOrder: 20, isActive: true },
  { name: 'Indiranagar',    city: 'Bangalore',  lat: 12.9784, lng: 77.6408, defaultRadiusKm: 6,  displayOrder: 21, isActive: true },
  { name: 'Whitefield',     city: 'Bangalore',  lat: 12.9698, lng: 77.7499, defaultRadiusKm: 10, displayOrder: 22, isActive: true },
  { name: 'JP Nagar',       city: 'Bangalore',  lat: 12.9063, lng: 77.5858, defaultRadiusKm: 8,  displayOrder: 23, isActive: true },
  { name: 'Marathahalli',   city: 'Bangalore',  lat: 12.9591, lng: 77.6974, defaultRadiusKm: 8,  displayOrder: 24, isActive: true },
  { name: 'HSR Layout',     city: 'Bangalore',  lat: 12.9116, lng: 77.6389, defaultRadiusKm: 6,  displayOrder: 25, isActive: true },
  // Hyderabad
  { name: 'Hitech City',    city: 'Hyderabad',  lat: 17.4435, lng: 78.3772, defaultRadiusKm: 10, displayOrder: 30, isActive: true },
  { name: 'Banjara Hills',  city: 'Hyderabad',  lat: 17.4156, lng: 78.4347, defaultRadiusKm: 8,  displayOrder: 31, isActive: true },
  { name: 'Secunderabad',   city: 'Hyderabad',  lat: 17.4399, lng: 78.4983, defaultRadiusKm: 10, displayOrder: 32, isActive: true },
  // Pune
  { name: 'Koregaon Park',  city: 'Pune',       lat: 18.5362, lng: 73.8961, defaultRadiusKm: 8,  displayOrder: 40, isActive: true },
  { name: 'Hinjewadi',      city: 'Pune',       lat: 18.5912, lng: 73.7389, defaultRadiusKm: 10, displayOrder: 41, isActive: true },
  { name: 'Kothrud',        city: 'Pune',       lat: 18.5074, lng: 73.8078, defaultRadiusKm: 8,  displayOrder: 42, isActive: true },
  // Chennai
  { name: 'Anna Nagar',     city: 'Chennai',    lat: 13.0878, lng: 80.2101, defaultRadiusKm: 8,  displayOrder: 50, isActive: true },
  { name: 'Velachery',      city: 'Chennai',    lat: 12.9815, lng: 80.2209, defaultRadiusKm: 8,  displayOrder: 51, isActive: true },
  { name: 'Nungambakkam',   city: 'Chennai',    lat: 13.0569, lng: 80.2425, defaultRadiusKm: 6,  displayOrder: 52, isActive: true },
];

@Injectable()
export class ServiceAreasService implements OnModuleInit {
  constructor(
    @InjectRepository(ServiceArea) private readonly repo: Repository<ServiceArea>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(SEED_AREAS.map((a) => this.repo.create(a)));
    }
  }

  findAll(activeOnly = true): Promise<ServiceArea[]> {
    return this.repo.find({
      where: activeOnly ? { isActive: true } : {},
      order: { city: 'ASC', displayOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ServiceArea> {
    const area = await this.repo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('Service area not found');
    return area;
  }

  async create(dto: CreateServiceAreaDto): Promise<ServiceArea> {
    const area = this.repo.create(dto);
    return this.repo.save(area);
  }

  async update(id: string, dto: UpdateServiceAreaDto): Promise<ServiceArea> {
    const area = await this.findOne(id);
    Object.assign(area, dto);
    return this.repo.save(area);
  }

  async remove(id: string): Promise<void> {
    const area = await this.findOne(id);
    await this.repo.remove(area);
  }
}
