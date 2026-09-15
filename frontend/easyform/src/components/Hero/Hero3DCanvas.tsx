import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Hero3DCanvasProps {
  mouseX: number;
  mouseY: number;
}

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({ mouseX, mouseY }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: mouseX, y: mouseY });

  // Update mouse ref without re-creating the Three.js scene
  useEffect(() => {
    mouseRef.current = { x: mouseX, y: mouseY };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera: Framed so the 4.0 x 5.5 paper document and floating objects are completely visible
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 8.4);

    // 3. Renderer with antialias and alpha
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.95);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff3db, 2.2);
    mainLight.position.set(4, 5, 5);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0xd49a4c, 3.8, 15);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    const backGlow = new THREE.PointLight(0x734822, 2.2, 10);
    backGlow.position.set(0, 1, -2);
    scene.add(backGlow);

    // 5. Procedural Canvas Texture for Government Paper Document
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Warm kraft / aged government paper background
      ctx.fillStyle = '#EBDDC9';
      ctx.fillRect(0, 0, 1024, 1400);

      // Paper grain noise
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 69, 51, 0.04)' : 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(Math.random() * 1024, Math.random() * 1400, 2, 2);
      }

      // Border frame
      ctx.strokeStyle = 'rgba(70, 50, 35, 0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 944, 1320);
      ctx.strokeRect(48, 48, 928, 1304);

      // Official Emblem / Seal Circle
      ctx.beginPath();
      ctx.arc(512, 140, 45, 0, Math.PI * 2);
      ctx.strokeStyle = '#8B251A';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#8B251A';
      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFFICIAL', 512, 135);
      ctx.font = '12px "Space Grotesk", sans-serif';
      ctx.fillText('SEAL 2026', 512, 153);

      // Header Typography
      ctx.fillStyle = '#2A1F16';
      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('DEPARTMENT OF PUBLIC REGISTRATION', 512, 220);

      ctx.fillStyle = '#5A4533';
      ctx.font = '600 20px "Space Grotesk", monospace';
      ctx.fillText('STANDARD ENTITLEMENT & CITIZEN FORM 4-B', 512, 255);

      // Watermark text across document
      ctx.save();
      ctx.translate(512, 700);
      ctx.rotate(-0.4);
      ctx.fillStyle = 'rgba(90, 69, 51, 0.05)';
      ctx.font = 'bold 110px "Space Grotesk", sans-serif';
      ctx.fillText('GOVERNMENT DRAFT', 0, 0);
      ctx.restore();

      // Form Table Grid & Sections
      ctx.strokeStyle = 'rgba(70, 50, 35, 0.4)';
      ctx.lineWidth = 1.5;
      
      const drawField = (y: number, label: string, boxH: number = 60, val: string = '') => {
        ctx.fillStyle = '#3D2D1E';
        ctx.font = 'bold 16px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, 70, y - 8);

        ctx.strokeRect(70, y, 884, boxH);
        if (val) {
          ctx.fillStyle = 'rgba(42, 31, 22, 0.7)';
          ctx.font = '18px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(val, 85, y + 36);
        }
      };

      drawField(320, '1. FULL LEGAL NAME OF APPLICANT', 55, 'RAJESH KUMAR SHARMA');
      drawField(410, '2. PERMANENT RESIDENTIAL ADDRESS & PIN CODE', 75, 'PLOT 42, CIVIL LINES, SECTOR 9');
      drawField(520, '3. AADHAAR / NATIONAL IDENTIFIER (12 DIGITS)', 55, 'XXXX - XXXX - 9821');
      drawField(610, '4. GROSS ANNUAL HOUSEHOLD INCOME (INR)', 55, 'INR 4,20,000 / ANNUM');
      drawField(700, '5. BANK ACCOUNT NUMBER & IFSC CODE', 55, 'SBIN0004921 — ACTIVE');
      drawField(790, '6. STATUTORY DECLARATION & CONSENT', 65, '[X] APPLICANT HEREBY CERTIFIES PARTICULARS UNDER OATH');

      // Signature Box & Red Stamp
      ctx.strokeRect(580, 900, 374, 110);
      ctx.fillStyle = '#3D2D1E';
      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.fillText('APPLICANT SIGNATURE SPECIMEN', 595, 890);

      // Red Stamped Box
      ctx.save();
      ctx.translate(200, 960);
      ctx.rotate(-0.08);
      ctx.strokeStyle = '#8B251A';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 240, 75);
      ctx.fillStyle = '#8B251A';
      ctx.font = 'bold 22px "Space Grotesk", sans-serif';
      ctx.fillText('VERIFIED · E-SIGN', 12, 44);
      ctx.restore();

      // Bottom Barcode & Form ID
      ctx.fillStyle = '#2A1F16';
      for (let i = 0; i < 60; i++) {
        const barW = (i % 3 === 0 ? 4 : 2);
        ctx.fillRect(80 + i * 8, 1260, barW, 40);
      }
      ctx.font = '13px "Space Grotesk", monospace';
      ctx.fillText('DOC ID: IND-2026-F4B-99812-AI-READY · PAGE 1 OF 2', 80, 1320);
    }

    const paperTexture = new THREE.CanvasTexture(canvas);
    paperTexture.generateMipmaps = true;
    paperTexture.minFilter = THREE.LinearMipmapLinearFilter;

    // Document 3D Curved Plane Geometry (Enlarged by 25% from 3.2 x 4.4 to 4.0 x 5.5)
    const docGeo = new THREE.PlaneGeometry(4.0, 5.5, 32, 32);
    // Subtle physical curl on paper edges
    const pos = docGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const curl = Math.sin(u * 0.72) * 0.15 - Math.cos(v * 0.56) * 0.1;
      pos.setZ(i, curl);
    }
    docGeo.computeVertexNormals();

    const docMat = new THREE.MeshStandardMaterial({
      map: paperTexture,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const docMesh = new THREE.Mesh(docGeo, docMat);
    docMesh.position.set(0, 0.45, 0);
    scene.add(docMesh);

    // 6. Floating Fountain Pens (nib at +Y) - Enlarged by 25%
    const createPen = () => {
      const penGroup = new THREE.Group();

      // Pen Body (charcoal matte lacquer)
      const bodyGeo = new THREE.CylinderGeometry(0.056, 0.056, 1.75, 16);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1a1918,
        roughness: 0.3,
        metalness: 0.8,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      penGroup.add(body);

      // Gold Trim Ring
      const ringGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 16);
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xe5ac62,
        roughness: 0.2,
        metalness: 0.9,
      });
      const ring = new THREE.Mesh(ringGeo, goldMat);
      ring.position.y = 0.5;
      penGroup.add(ring);

      // Gold Nib Cone (aims along +Y)
      const nibGeo = new THREE.ConeGeometry(0.056, 0.31, 16);
      const nib = new THREE.Mesh(nibGeo, goldMat);
      nib.position.y = 1.02;
      penGroup.add(nib);

      // Pen Clip
      const clipGeo = new THREE.BoxGeometry(0.025, 0.5, 0.025);
      const clip = new THREE.Mesh(clipGeo, goldMat);
      clip.position.set(0.07, 0.12, 0);
      penGroup.add(clip);

      return penGroup;
    };

    const pen1 = createPen();
    pen1.position.set(2.8, 1.3, 0.9);
    scene.add(pen1);

    const pen2 = createPen();
    pen2.position.set(-2.9, -0.9, 1.3);
    scene.add(pen2);

    // 7. Floating Crumpled Paper Balls - Enlarged by 25%
    const createPaperBall = (size: number, colorHex: number) => {
      const geo = new THREE.IcosahedronGeometry(size, 2);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
        const noise = 1 + (Math.random() - 0.5) * 0.35;
        v.multiplyScalar(noise);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.95,
        flatShading: true,
      });

      return new THREE.Mesh(geo, mat);
    };

    const ball1 = createPaperBall(0.30, 0xebddc9);
    ball1.position.set(-2.6, 1.8, 0.6);
    scene.add(ball1);

    const ball2 = createPaperBall(0.225, 0xd8c7b3);
    ball2.position.set(3.0, -1.3, 1.0);
    scene.add(ball2);

    const ball3 = createPaperBall(0.175, 0xf5efeb);
    ball3.position.set(-2.1, -1.9, -0.2);
    scene.add(ball3);

    // 8. Subtle Paper Fragments Floating - Enlarged by 25%
    const createFragment = (w: number, h: number) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xeadfd3,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });
      return new THREE.Mesh(geo, mat);
    };

    const frag1 = createFragment(0.5, 0.38);
    frag1.position.set(2.2, 2.1, -0.4);
    scene.add(frag1);

    const frag2 = createFragment(0.38, 0.56);
    frag2.position.set(-3.0, 0.3, 0.4);
    scene.add(frag2);

    // 9. Floating Golden Dust Particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 8;
      particlePositions[i + 1] = (Math.random() - 0.5) * 6;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xe5ac62,
      size: 0.04,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 10. Animation Loop: Elements turn in the direction of the pointer
    let clock = new THREE.Clock();
    let reqId: number;

    const upVector = new THREE.Vector3(0, 1, 0);
    const forwardVector = new THREE.Vector3(0, 0, 1);

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      // Mouse sensitivity reduced by 15% (multiplier * 0.85) for calm, controlled response
      const currentMouseX = mouseRef.current.x * 0.85;
      const currentMouseY = mouseRef.current.y * 0.85;

      // 3D Pointer target position in world space
      const pointerTarget = new THREE.Vector3(
        currentMouseX * 5.2,
        -currentMouseY * 4.2 + 0.4,
        3.2
      );

      // ==========================================
      // 1. GOVERNMENT FORM: TURNS TOWARDS POINTER
      // ==========================================
      if (docMesh) {
        // Calculate angle needed so paper faces towards the pointer
        const docTargetRotY = currentMouseX * 0.85 + Math.cos(elapsedTime * 0.6) * 0.03;
        const docTargetRotX = -currentMouseY * 0.65 - 0.05 + Math.sin(elapsedTime * 0.7) * 0.03;
        const docTargetRotZ = -currentMouseX * 0.15;

        // Smooth physical turn
        docMesh.rotation.x = THREE.MathUtils.lerp(docMesh.rotation.x, docTargetRotX, 0.07);
        docMesh.rotation.y = THREE.MathUtils.lerp(docMesh.rotation.y, docTargetRotY, 0.07);
        docMesh.rotation.z = THREE.MathUtils.lerp(docMesh.rotation.z, docTargetRotZ, 0.07);

        // Position shifts slightly towards pointer
        docMesh.position.x = THREE.MathUtils.lerp(docMesh.position.x, currentMouseX * 0.25, 0.06);
        docMesh.position.y = 0.35 + Math.sin(elapsedTime * 0.9) * 0.08 - currentMouseY * 0.15;
      }

      // ==========================================
      // 2. PENS: NIBS TURN & POINT TOWARDS POINTER
      // ==========================================
      if (pen1) {
        // Calculate direction vector from pen1 to pointer
        const dir1 = new THREE.Vector3().subVectors(pointerTarget, pen1.position).normalize();
        const targetQuat1 = new THREE.Quaternion().setFromUnitVectors(upVector, dir1);
        pen1.quaternion.slerp(targetQuat1, 0.075);

        // Subtle position parallax & floating
        pen1.position.x = 2.8 + currentMouseX * 0.35;
        pen1.position.y = 1.3 - currentMouseY * 0.3 + Math.sin(elapsedTime * 1.1) * 0.1;
      }

      if (pen2) {
        // Calculate direction vector from pen2 to pointer
        const dir2 = new THREE.Vector3().subVectors(pointerTarget, pen2.position).normalize();
        const targetQuat2 = new THREE.Quaternion().setFromUnitVectors(upVector, dir2);
        pen2.quaternion.slerp(targetQuat2, 0.075);

        // Subtle position parallax & floating
        pen2.position.x = -2.9 + currentMouseX * 0.3;
        pen2.position.y = -0.9 - currentMouseY * 0.25 + Math.cos(elapsedTime * 0.8) * 0.1;
      }

      // ==========================================
      // 3. PAPER BALLS: TURN & FACE TOWARDS POINTER
      // ==========================================
      const paperBalls = [ball1, ball2, ball3];
      const basePositions = [
        { x: -2.6, y: 1.8, z: 0.6 },
        { x: 3.0, y: -1.3, z: 1.0 },
        { x: -2.1, y: -1.9, z: -0.2 },
      ];

      paperBalls.forEach((ball, idx) => {
        // Direction vector from paper ball to pointer
        const dirBall = new THREE.Vector3().subVectors(pointerTarget, ball.position).normalize();
        const targetBallQuat = new THREE.Quaternion().setFromUnitVectors(forwardVector, dirBall);
        
        // Slerp to face pointer
        ball.quaternion.slerp(targetBallQuat, 0.08);
        
        // Add subtle continuous rotational drift along its axis
        ball.rotateOnAxis(upVector, 0.006 * (idx % 2 === 0 ? 1 : -1));

        // Parallax position
        const base = basePositions[idx];
        ball.position.x = base.x + currentMouseX * (0.2 + idx * 0.1);
        ball.position.y = base.y - currentMouseY * (0.2 + idx * 0.1) + Math.sin(elapsedTime * (1 + idx * 0.3)) * 0.08;
      });

      // ==========================================
      // 4. FRAGMENTS: TURN TOWARDS POINTER
      // ==========================================
      const dirFrag1 = new THREE.Vector3().subVectors(pointerTarget, frag1.position).normalize();
      const targetFrag1 = new THREE.Quaternion().setFromUnitVectors(forwardVector, dirFrag1);
      frag1.quaternion.slerp(targetFrag1, 0.06);
      frag1.position.y = 1.8 + Math.sin(elapsedTime * 0.6) * 0.07 - currentMouseY * 0.15;

      const dirFrag2 = new THREE.Vector3().subVectors(pointerTarget, frag2.position).normalize();
      const targetFrag2 = new THREE.Quaternion().setFromUnitVectors(forwardVector, dirFrag2);
      frag2.quaternion.slerp(targetFrag2, 0.06);
      frag2.position.y = 0.2 + Math.cos(elapsedTime * 0.7) * 0.07 - currentMouseY * 0.15;

      // 5. Particles
      if (particles) {
        particles.rotation.y = elapsedTime * 0.02 + currentMouseX * 0.1;
      }

      renderer.render(scene, camera);
      reqId = requestAnimationFrame(animate);
    };

    animate();

    // Resize listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqId) {
        cancelAnimationFrame(reqId);
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      docGeo.dispose();
      docMat.dispose();
      paperTexture.dispose();
    };
  }, []); // Run once on mount!

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};
